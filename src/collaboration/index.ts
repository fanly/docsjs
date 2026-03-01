/**
 * Collaboration Module
 * 
 * Provides real-time collaboration using Yjs CRDT.
 */

import * as Y from 'yjs';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: { index: number; length: number };
}

export interface CollaborationEvent {
  type: 'join' | 'leave' | 'update' | 'sync';
  userId: string;
  timestamp: number;
  data?: unknown;
}

export interface CollaborationCallbacks {
  onConnect?: (user: CollaborationUser) => void;
  onDisconnect?: (userId: string) => void;
  onUpdate?: (update: Uint8Array, origin: string) => void;
  onSync?: (isSynced: boolean) => void;
}

export interface CollaborationDoc {
  id: string;
  ydoc: Y.Doc;
  users: Map<string, CollaborationUser>;
  awareness: any;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export class CollaborationManager {
  private docs = new Map<string, CollaborationDoc>();
  private callbacks: CollaborationCallbacks = {};
  private provider: any = null;

  constructor(callbacks?: CollaborationCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  async createDocument(id: string): Promise<CollaborationDoc> {
    if (this.docs.has(id)) {
      return this.docs.get(id)!;
    }

    const ydoc = new Y.Doc();
    const awareness = new Map();

    const doc: CollaborationDoc = {
      id,
      ydoc,
      users: new Map(),
      awareness
    };

    ydoc.on('update', (update: Uint8Array, origin: string) => {
      if (this.callbacks.onUpdate) {
        this.callbacks.onUpdate(update, origin);
      }
    });

    this.docs.set(id, doc);
    return doc;
  }

  async joinDocument(docId: string, user: { id: string; name: string }): Promise<CollaborationDoc | null> {
    let doc = this.docs.get(docId);
    
    if (!doc) {
      doc = await this.createDocument(docId);
    }

    const colorIndex = doc.users.size % USER_COLORS.length;
    const collaborationUser: CollaborationUser = {
      id: user.id,
      name: user.name,
      color: USER_COLORS[colorIndex]
    };

    doc.users.set(user.id, collaborationUser);

    if (this.callbacks.onConnect) {
      this.callbacks.onConnect(collaborationUser);
    }

    return doc;
  }

  async leaveDocument(docId: string, userId: string): Promise<void> {
    const doc = this.docs.get(docId);
    if (!doc) return;

    doc.users.delete(userId);

    if (this.callbacks.onDisconnect) {
      this.callbacks.onDisconnect(userId);
    }

    if (doc.users.size === 0) {
      // Keep the doc for a while but mark as inactive
    }
  }

  getDocument(docId: string): CollaborationDoc | undefined {
    return this.docs.get(docId);
  }

  getText(docId: string): Y.Text | null {
    const doc = this.docs.get(docId);
    return doc ? doc.ydoc.getText('content') : null;
  }

  getXmlFragment(docId: string, name: string = 'default'): Y.XmlFragment | null {
    const doc = this.docs.get(docId);
    return doc ? doc.ydoc.getXmlFragment(name) : null;
  }

  applyUpdate(docId: string, update: Uint8Array, origin: string = 'remote'): void {
    const doc = this.docs.get(docId);
    if (!doc) return;

    Y.applyUpdate(doc.ydoc, update);
  }

  setProvider(provider: any): void {
    this.provider = provider;
  }

  destroyDocument(docId: string): void {
    const doc = this.docs.get(docId);
    if (doc) {
      doc.ydoc.destroy();
      this.docs.delete(docId);
    }
  }

  destroy(): void {
    for (const doc of this.docs.values()) {
      doc.ydoc.destroy();
    }
    this.docs.clear();
  }

  getConnectedUsers(docId: string): CollaborationUser[] {
    const doc = this.docs.get(docId);
    return doc ? Array.from(doc.users.values()) : [];
  }

  getDocumentState(docId: string): Uint8Array | null {
    const doc = this.docs.get(docId);
    return doc ? Y.encodeStateAsUpdate(doc.ydoc) : null;
  }
}

export function createCollaborationManager(callbacks?: CollaborationCallbacks): CollaborationManager {
  return new CollaborationManager(callbacks);
}

// WebSocket provider for real-time sync
export class WebSocketCollaborationProvider {
  private manager: CollaborationManager;
  private socket: WebSocket | null = null;
  private docId: string;
  private userId: string;

  constructor(manager: CollaborationManager, docId: string, userId: string) {
    this.manager = manager;
    this.docId = docId;
    this.userId = userId;
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.socket?.send(JSON.stringify({
          type: 'join',
          docId: this.docId,
          userId: this.userId
        }));
        resolve();
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.update) {
          const update = new Uint8Array(data.update);
          this.manager.applyUpdate(this.docId, update, 'remote');
        }
      };

      this.socket.onerror = reject;
      this.socket.onclose = () => {
        this.manager.leaveDocument(this.docId, this.userId);
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendUpdate(update: Uint8Array): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'update',
        docId: this.docId,
        update: Array.from(update)
      }));
    }
  }
}

export { Y };
