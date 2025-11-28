/**
 * SYNC MODULE INDEX
 * ==================
 * Export all sync-related modules for easy importing
 */

export { GeminiSyncManager, geminiSync } from './gemini-sync-manager';
export { HostingerSyncManager, hostingerSync } from './hostinger-sync-manager';
export { UnifiedSyncOrchestrator, unifiedSync, initializeSync } from './unified-sync-orchestrator';

// Re-export types
export type { GeminiCommand, GeminiStatus, SyncState } from './gemini-sync-manager';
export type { HorizonsSystemStatus, DashboardUpdate, HorizonsConfig, FirebaseCredentials } from './hostinger-sync-manager';
export type { UnifiedSyncStatus, SyncEvent, AgentDirective } from './unified-sync-orchestrator';
