/**
 * Pipeline Manager Implementation
 * 
 * Handles the orchestration of the document transformation lifecycle.
 */

import type { 
  PipelineContext, 
  PipelineState, 
  PipelinePhase,
  PipelineHook,
  PipelineMetrics,
  ExportResult
} from './types';
import type { CoreEngine } from '../engine/core';
import type { 
  DocxParseOptions, 
  DocxParseResult 
} from '../parsers';
import type { HtmlRenderOptions, HtmlRenderResult } from '../renderers';
import { DOCXParser } from '../parsers/docx/parser';
import { HTMLRenderer } from '../renderers/html/renderer';
import { DocumentAST } from '../ast/types';

export const DEFAULT_PIPELINE_CONTEXT: PipelineContext = {
  engine: null as any, // Will be set at runtime
  profile: null as any, // Will be set at runtime
  config: null as any, // Will be set at runtime
  input: '',
  state: {
    phase: 'initializing',
    intermediate: {},
    errors: [],
    warnings: [],
    pluginContexts: {},
  },
  hooks: {
    beforeParse: [],
    afterParse: [],
    beforeTransform: [],
    afterTransform: [],
    beforeRender: [],
    afterRender: [],
    beforeExport: [],
    afterExport: [],
  },
  metrics: {
    totalTimeMs: 0,
    currentPhase: 'initializing',
    phaseTimes: {
      initializing: 0,
      parsing: 0,
      transforming: 0,
      rendering: 0,
      exporting: 0,
      complete: 0,
      failed: 0,
    },
    processedChars: 0,
    processedBytes: 0,
    pluginApplications: 0,
  }
};

export class PipelineManager {
  private engine: CoreEngine;
  
  constructor(engine: CoreEngine) {
    this.engine = engine;
  }

  updatePerformanceLimits(performanceConfig: EngineConfig['performance']): void {
    // Eventually we can adjust pipeline behavior based on these limits
    console.log(`Performance limits updated: ${JSON.stringify(performanceConfig)}`);
  }

  async execute(context: PipelineContext): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      // Set up the context
      const execContext = { ...context };
      execContext.state.phase = 'initializing';
      execContext.metrics.totalTimeMs = startTime;
      
      // Run lifecycle hooks and operations
      await this.runBeforeParseHooks(execContext);
      
      // Parse input to AST
      execContext.state.phase = 'parsing';
      const parseStartTime = Date.now();
      await this.parseToAST(execContext);
      execContext.metrics.phaseTimes.parsing += Date.now() - parseStartTime;
      
      await this.runAfterParseHooks(execContext);
      
      // Run transforms on AST
      execContext.state.phase = 'transforming';
      const transformStartTime = Date.now();
      await this.applyTransformations(execContext);
      execContext.metrics.phaseTimes.transforming += Date.now() - transformStartTime;
      
      await this.runAfterTransformHooks(execContext);
      
      // Render into desired output format
      execContext.state.phase = 'rendering';
      const renderStartTime = Date.now();
      await this.renderOutput(execContext);
      execContext.metrics.phaseTimes.rendering += Date.now() - renderStartTime;
      
      await this.runAfterRenderHooks(execContext);
      
      // Prepare final export
      execContext.state.phase = 'exporting';
      const exportResult = await this.prepareExport(execContext);
      
      execContext.state.phase = 'complete';
      execContext.metrics.phaseTimes.complete = Date.now();
      execContext.metrics.totalTimeMs = Date.now() - startTime;
      
      await this.runAfterExportHooks(execContext);
      
      return exportResult;
    } catch (error) {
      // Log error and update state
      const pipelineError: PipelineError = {
        code: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        phase: context.state.phase,
        timestamp: Date.now(),
        severity: 'critical'
      };
      
      context.state.errors.push(pipelineError);
      context.state.phase = 'failed';
      execContext.metrics.phaseTimes.failed = Date.now();
      execContext.metrics.totalTimeMs = Date.now() - startTime;
      
      throw error;
    }
  }

  private async runBeforeParseHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('beforeParse', context);
  }

  private async runAfterParseHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('afterParse', context);
  }

  private async runBeforeTransformHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('beforeTransform', context);
  }

  private async runAfterTransformHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('afterTransform', context);
  }

  private async runBeforeRenderHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('beforeRender', context);
  }

  private async runAfterRenderHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('afterRender', context);
  }

  private async runBeforeExportHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('beforeExport', context);
  }

  private async runAfterExportHooks(context: PipelineContext): Promise<void> {
    await this.runHookSequence('afterExport', context);
  }

  private async runHookSequence(hookName: keyof PipelineHooks, context: PipelineContext): Promise<void> {
    const hooks = context.hooks[hookName];
    for (const hook of hooks) {
      try {
        await Promise.resolve(hook(context));
        context.metrics.pluginApplications++;
      } catch (error) {
        const pipelineError: PipelineError = {
          code: 'HOOK_EXECUTION_ERROR',
          message: `Hook ${hookName} failed: ${error instanceof Error ? error.message : String(error)}`,
          phase: context.state.phase,
          timestamp: Date.now(),
          severity: 'error'
        };
        context.state.errors.push(pipelineError);
      }
    }
  }

  private async parseToAST(context: PipelineContext): Promise<void> {
    // Determine file type and route to appropriate parser
    let result: DocxParseResult | null = null;
    
    if (context.input instanceof File) {
      if (context.input.name.endsWith('.docx')) {
        const parser = new DOCXParser(context.profile.parse);
        result = await parser.parse(context.input);
      } else {
        throw new Error(`Unsupported file type: ${context.input.name}`);
      }
    } else if (typeof context.input === 'string') {
      // For now, assume it's HTML - in the future this could be smarter
      // This would connect to HTML parser, markdown parser, etc.
      throw new Error('String input parsing not fully implemented yet');
    } else {
      throw new Error('Unsupported input type');
    }
    
    if (result) {
      context.state.ast = result.ast;
      context.metrics.processedBytes = result.report.byteSize || 0;
      context.metrics.processedChars = result.report.characterCount || 0;
      
      // Process parser-generated diagnostics
      if (result.report.warnings && result.report.warnings.length > 0) {
        for (const warning of result.report.warnings) {
          context.state.warnings.push({
            code: 'PARSER_WARNING',
            message: warning,
            phase: 'parsing',
            timestamp: Date.now()
          });
        }
      }
    }
  }

  private async applyTransformations(context: PipelineContext): Promise<void> {
    if (!context.state.ast) {
      throw new Error('Cannot apply transformations - AST is null');
    }

    // Apply all registered transformation plugins
    // In the future, this would be a more sophisticated transformation pipeline
    // For now, we'll simulate transformation plugin applications

    // Get the AST from context
    let currentAST = context.state.ast;

    // Run "beforeTransform" lifecycle hooks that could potentially
    // modify the AST in ways that transformations expect
    for (const hook of context.hooks.beforeTransform) {
      // Run any beforeTransform hooks that may influence the transformation
      // (These might add plugin contexts or set up state for transformations)
      await Promise.resolve(hook(context));
    }

    // In a full implementation, we would apply registered transformation plugins here:
    //
    // const transformPlugins = context.engine.getPluginsByHook('transform');
    // for (const plugin of transformPlugins) {
    //   try {
    //     currentAST = await plugin.transform(currentAST, context);
    //   } catch (error) {
    //     // Report error and potentially continue or fail depending on error tolerance
    //     context.state.errors.push({
    //       code: 'TRANSFORM_PLUGIN_ERROR',
    //       message: error instanceof Error ? error.message : String(error),
    //       phase: context.state.phase,
    //       timestamp: Date.now(),
    //       pluginName: plugin.name,
    //       severity: 'error'
    //     });
    //   }
    // }

    // Store result
    context.state.ast = currentAST;

    // Post-transformation validation hook
    await this.runHookSequence('afterTransform', context);
  }

  private async renderOutput(context: PipelineContext): Promise<void> {
    if (!context.state.ast) {
      throw new Error('Cannot render - AST is null');
    }

    // Route to appropriate renderer based on profile
    switch (context.profile.render.outputFormat) {
      case 'html':
        const htmlOpts: HtmlRenderOptions = {
          mode: 'fidelity', // Could be configurable
          includeDataAttrs: true,
          wrapAsDocument: false,
          ...context.profile.render.options
        };
        const htmlRenderer = new HTMLRenderer(htmlOpts);
        const htmlResult: HtmlRenderResult = htmlRenderer.render(context.state.ast);
        
        context.state.intermediate.renderedOutput = htmlResult.html;
        break;
        
      case 'markdown':
        // Would use MarkdownRenderer
        throw new Error('Markdown renderer not implemented yet');
        
      case 'json':
        context.state.intermediate.renderedOutput = JSON.stringify(context.state.ast, null, 2);
        break;
        
      default:
        throw new Error(`Unknown output format: ${context.profile.render.outputFormat}`);
    }
  }

  private async prepareExport(context: PipelineContext): Promise<ExportResult> {
    // Prepare the final export result
    const exportResult: ExportResult = {
      output: context.state.intermediate.renderedOutput || '',
      diagnostics: {
        errors: context.state.errors.map(err => `${err.code}: ${err.message}`),
        warnings: context.state.warnings.map(warn => `${warn.code}: ${warn.message}`),
        stats: {
          phase_times: context.metrics.phaseTimes,
          processed_bytes: context.metrics.processedBytes,
          processed_chars: context.metrics.processedChars,
          plugin_applications: context.metrics.pluginApplications,
          total_time_ms: context.metrics.totalTimeMs
        },
        metadata: {
          engineVersion: '2.0.0-alpha', // Placeholder
          astVersion: context.state.ast?.version || 'unknown',
          pipelineProfile: context.profile.id,
          transformTimeMs: context.metrics.totalTimeMs,
          inputSizeBytes: context.metrics.processedBytes || 0,
          outputSizeBytes: typeof context.state.intermediate.renderedOutput === 'string' 
            ? context.state.intermediate.renderedOutput.length 
            : 0
        }
      }
    };

    return exportResult;
  }
}