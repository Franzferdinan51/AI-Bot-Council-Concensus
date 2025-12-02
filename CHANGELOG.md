# Changelog

## [2.3.3] - 2025-12-02
 
 ### Added
 
 - **Enhanced Logging**:
   - Implemented file-based logging with rotation in `src/services/logger.ts`.
   - Added granular logging for AI API calls, session lifecycle, and tool execution.
   - Enabled `stderr` output for all logs to provide real-time terminal visibility without breaking MCP protocol.
 
 - **Enhanced Diagnostics**:
   - Updated `council_diagnostics` tool to provide server health metrics (uptime, memory), active session summaries, and recent log entries.
 
 ### Fixed
 
 - **Stability**:
   - Added 120-second timeout to all AI service calls (`aiService.ts`) to prevent server hanging on unresponsive API requests.
 
 ## [2.3.2] - 2025-12-02
 
 ### Fixed
 
 - **Bot Responses**:
   - Fixed a critical bug where bot responses were stuck at `...` due to a message ID mismatch during updates.
   - Fixed a streaming concatenation issue that would have caused garbled output.
 
 ## [2.3.1] - 2025-12-02
 
 ### Fixed
 
 - **Tool Routing**:
   - Fixed an issue where `council_diagnostics` and other session tools were incorrectly routed to the management handler, causing "Unknown tool" errors.
   - Updated `src/index.ts` to correctly route all council session tools.
 
 ## [2.3.0] - 2025-12-02
 
 ### Fixed
 
 - **Type Safety**:
   - Fixed `@ts-ignore` usage in `src/index.ts` by adding proper `CallToolResult` type.
   - Updated `AuthorType` enum to include `SYSTEM` and `USER` types.
   - Removed `as any` casts in `src/services/councilOrchestrator.ts` and `src/services/sessionService.ts`.
 
 - **Error Handling**:
   - Improved error handling in `src/services/aiService.ts` with specific try-catch blocks for Gemini API calls.
   - Added more descriptive error messages for API failures.
 
 - **Robustness**:
   - Enhanced regex patterns in `src/services/councilOrchestrator.ts` to be more flexible with LLM output variations (bolding, whitespace, prefixes).
 
 ## [1.0.0] - 2024-11-30

### Added

- Initial release of AI Council Chamber MCP Server
- **7 Session Modes**:
  - Proposal: Legislative debate with voting and consensus
  - Deliberation: Roundtable discussion without voting
  - Inquiry: Q&A format with synthesis
  - Research: Multi-phase deep investigation
  - Swarm: Dynamic task decomposition with parallel execution
  - Swarm Coding: Software development workflow
  - Prediction: Superforecasting with probabilistic analysis

- **20+ Pre-configured Personas**:
  - Core Council: Speaker, Facilitator, Technocrat, Ethicist, Pragmatist
  - Extended Council: Visionary, Sentinel, Historian, Diplomat, Skeptic, Conspiracist, Journalist, Propagandist, Psychologist, Libertarian, Progressive, Conservative, Independent
  - Specialists: Coder, Legal, Science, Finance, Military, Medical

- **Multi-Provider AI Support**:
  - Google Gemini (primary)
  - OpenRouter (Claude, GPT-4, Llama, etc.)
  - LM Studio (local models)
  - Ollama (local models)
  - Jan AI
  - OpenAI-compatible endpoints
  - Z.ai
  - Moonshot
  - Minimax

- **Council Features**:
  - Real-time token streaming
  - Economy mode for cost reduction
  - Challenge protocol in debates
  - Pass mechanism to yield floor
  - Moderator intervention for loops
  - Consensus scoring and labels
  - Prediction confidence analysis
  - Code artifact generation

- **Knowledge Management**:
  - Persistent memory for precedents
  - RAG document storage
  - Semantic search capabilities
  - Memory tagging and categorization

- **Session Management**:
  - Session listing and retrieval
  - Stop/pause controls
  - Full transcript storage
  - Vote data preservation
  - Prediction results tracking

- **Cost Control**:
  - Economy mode (simulated debates)
  - Max concurrent requests limit
  - Context pruning
  - Rate limit protection

### Documentation

- Comprehensive README with usage examples
- Claude Desktop integration guide
- API reference for all tools
- Configuration examples
- Troubleshooting guide
- Architecture documentation

### Examples

- Python client examples
- Configuration templates
- Claude Desktop setup guide
- Sample conversation flows
