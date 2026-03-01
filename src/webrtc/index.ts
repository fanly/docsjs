/**
 * WebRTC Module
 * 
 * Provides real-time peer-to-peer communication for collaboration.
 */

export interface PeerConnection {
  id: string;
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  from: string;
  to?: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  iceCandidatePoolSize?: number;
}

export interface PeerCallbacks {
  onConnect?: (peerId: string) => void;
  onDisconnect?: (peerId: string) => void;
  onData?: (peerId: string, data: unknown) => void;
  onError?: (peerId: string, error: Error) => void;
}

const DEFAULT_IC_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export class WebRTCManager {
  private localId: string;
  private config: WebRTCConfig;
  private callbacks: PeerCallbacks;
  private peers = new Map<string, PeerConnection>();
  private signalingSocket: WebSocket | null = null;

  constructor(localId: string, config?: WebRTCConfig, callbacks?: PeerCallbacks) {
    this.localId = localId;
    this.config = {
      iceServers: config?.iceServers || DEFAULT_IC_SERVERS,
      iceCandidatePoolSize: config?.iceCandidatePoolSize || 10
    };
    this.callbacks = callbacks || {};
  }

  /**
   * Connect to signaling server
   */
  async connect(signalingUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingSocket = new WebSocket(signalingUrl);

      this.signalingSocket.onopen = () => {
        // Send join message
        this.sendSignaling({
          type: 'join',
          from: this.localId,
          payload: {}
        });
        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        const message: SignalingMessage = JSON.parse(event.data);
        this.handleSignalingMessage(message);
      };

      this.signalingSocket.onerror = (error) => {
        reject(error);
      };

      this.signalingSocket.onclose = () => {
        this.disconnectAll();
      };
    });
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }
    this.disconnectAll();
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (this.peers.has(peerId)) {
      return; // Already connected
    }

    const connection = new RTCPeerConnection(this.config);

    // Create data channel
    const dataChannel = connection.createDataChannel('data');
    this.setupDataChannel(peerId, dataChannel);

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling({
          type: 'ice-candidate',
          from: this.localId,
          to: peerId,
          payload: event.candidate.toJSON()
        });
      }
    };

    // Handle connection state
    connection.onconnectionstatechange = () => {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.status = connection.connectionState as PeerConnection['status'];
        
        if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
          this.callbacks.onDisconnect?.(peerId);
          this.peers.delete(peerId);
        }
      }
    };

    // Create and send offer
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    this.sendSignaling({
      type: 'offer',
      from: this.localId,
      to: peerId,
      payload: offer
    });

    this.peers.set(peerId, {
      id: this.localId,
      peerId,
      connection,
      dataChannel,
      status: 'connecting'
    });
  }

  /**
   * Disconnect from a specific peer
   */
  disconnectFromPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.dataChannel?.close();
      peer.connection.close();
      this.peers.delete(peerId);
      this.callbacks.onDisconnect?.(peerId);
    }
  }

  /**
   * Disconnect from all peers
   */
  disconnectAll(): void {
    for (const peerId of this.peers.keys()) {
      this.disconnectFromPeer(peerId);
    }
  }

  /**
   * Send data to a specific peer
   */
  sendToPeer(peerId: string, data: unknown): boolean {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.dataChannel || peer.status !== 'connected') {
      return false;
    }

    try {
      peer.dataChannel.send(JSON.stringify(data));
      return true;
    } catch (error) {
      this.callbacks.onError?.(peerId, error as Error);
      return false;
    }
  }

  /**
   * Broadcast data to all connected peers
   */
  broadcast(data: unknown): void {
    for (const peerId of this.peers.keys()) {
      this.sendToPeer(peerId, data);
    }
  }

  /**
   * Get all connected peer IDs
   */
  getConnectedPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  /**
   * Get peer connection status
   */
  getPeerStatus(peerId: string): PeerConnection['status'] | null {
    return this.peers.get(peerId)?.status || null;
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.status = 'connected';
      }
      this.callbacks.onConnect?.(peerId);
    };

    channel.onclose = () => {
      this.callbacks.onDisconnect?.(peerId);
      this.peers.delete(peerId);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.callbacks.onData?.(peerId, data);
      } catch {
        this.callbacks.onData?.(peerId, event.data);
      }
    };

    channel.onerror = (error) => {
      this.callbacks.onError?.(peerId, new Error('Data channel error'));
    };
  }

  private handleSignalingMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'join':
        // New peer joined, could auto-connect
        break;

      case 'leave':
        this.disconnectFromPeer(message.from);
        break;

      case 'offer':
        this.handleOffer(message.from, message.payload as RTCSessionDescriptionInit);
        break;

      case 'answer':
        this.handleAnswer(message.from, message.payload as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        this.handleIceCandidate(message.from, message.payload as RTCIceCandidateInit);
        break;
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const connection = new RTCPeerConnection(this.config);

    // Handle incoming data channel
    connection.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling({
          type: 'ice-candidate',
          from: this.localId,
          to: peerId,
          payload: event.candidate.toJSON()
        });
      }
    };

    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    this.sendSignaling({
      type: 'answer',
      from: this.localId,
      to: peerId,
      payload: answer
    });

    this.peers.set(peerId, {
      id: this.localId,
      peerId,
      connection,
      status: 'connecting'
    });
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private sendSignaling(message: SignalingMessage): void {
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }
}

export function createWebRTCManager(
  localId: string,
  config?: WebRTCConfig,
  callbacks?: PeerCallbacks
): WebRTCManager {
  return new WebRTCManager(localId, config, callbacks);
}
