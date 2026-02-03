# RustMaster: AI-Powered Rust Learning Platform

A comprehensive spaced repetition system (SRS) designed specifically for C++ and Python developers learning Rust. Built with modern web technologies and backed by a TypeScript/Express server.

## 🎯 Core Features

### Knowledge Lattice (DAG)
- **Directed Acyclic Graph** curriculum structure using `curriculum.json`
- **Prerequisite-based accessibility**: Concepts unlock only when prerequisites reach ≥80% mastery
- **Visual graph representation** with ReactFlow integration

### SM2 Spaced Repetition Algorithm
- **Intelligent review scheduling** based on performance quality (0-5 scale)
- **Adaptive intervals**: Success increases spacing, failure resets to daily reviews
- **Mastery tracking**: Linear progression from 0.0 to 1.0 based on SRS performance

### Synthesis Engine
- **LLM-powered challenge generation** combining multiple concepts
- **Bridge analogies**: Contextual explanations linking Rust to C++/Python mental models
- **Error-specific feedback** using Google Gemini AI

### Interactive Learning Environment
- **Real Rust compiler integration** via `cargo check`
- **AI Coach**: Contextual error explanations with language analogies
- **Challenge Labs**: Immersive coding environments with live feedback

## 🏗️ Architecture

### Backend (TypeScript/Express)
```
rustmaster/backend/
├── src/
│   ├── index.ts          # Express server with API routes
│   ├── lattice.ts        # Knowledge graph logic
│   ├── srs.ts           # SM2 algorithm implementation
│   ├── synthesis.ts     # LLM prompt generation
│   ├── compiler.ts      # Cargo check integration
│   └── models.ts        # TypeScript interfaces
├── curriculum.json      # DAG structure definition
├── user_state.json      # Persistent user progress
└── package.json
```

### Frontend (React/Astro)
```
src/
├── components/
│   ├── RustMasterApp.tsx      # Main application orchestrator
│   ├── RustMaster/
│   │   ├── Dashboard.tsx      # Learning overview & SRS queue
│   │   ├── ChallengeLab.tsx   # Interactive coding environment
│   │   ├── BridgeCard.tsx     # Mental model explanations
│   │   └── CustomNode.tsx     # Graph node visualization
│   └── RerunViewer3D.tsx      # 3D visualization (separate)
└── pages/
    └── rust-master.astro      # Entry point with client:load
```

## 🚀 API Endpoints

### GET `/api/lattice`
Returns complete curriculum and user state for frontend initialization.

### GET `/api/srs/due`
Returns array of concept slugs due for review based on SRS scheduling and accessibility.

### POST `/api/challenge/solve`
Executes `cargo check` on user code, updates mastery scores, and returns compilation results.

**Request Body:**
```json
{
  "code": "fn main() { println!(\"Hello, Rust!\"); }"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Compiling...\nFinished dev [unoptimized + debuginfo] target(s) in 0.12s",
  "updated_mastery": [["ownership-move", 0.15]]
}
```

## 🔧 Setup & Development

### Prerequisites
- Node.js 18+
- Rust/Cargo (for backend compilation)
- Git

### Backend Setup
```bash
cd rustmaster/backend
npm install
npm run build
npm start  # Runs on http://localhost:8000
```

### Frontend Setup
```bash
npm install
npm run dev  # Runs on http://localhost:4321
```

### Full Development
1. Start backend: `cd rustmaster/backend && npm start`
2. Start frontend: `npm run dev`
3. Visit: `http://localhost:4321/rust-master`

## 🎨 Key Implementation Details

### WASM Asset Management
- **Critical**: `re_viewer.js` and `re_viewer_bg.wasm` must be in `/public/`
- **Not bundled**: Vite doesn't automatically copy these from `node_modules`
- **Absolute URLs**: Always use `window.location.origin` for WebViewer initialization

### Astro Hydration
- **Mandatory**: Use `client:only="react"` for components with browser APIs
- **RerunViewer3D**: Requires WebGL, WASM, and Navigation APIs
- **RustMaster**: Uses fetch API for backend communication

### State Persistence
- **Atomic writes**: Backend uses temporary files to prevent corruption
- **File pattern**: `user_state.json.tmp` → `user_state.json`
- **No database**: Simple JSON file storage for demo purposes

### SRS Algorithm Details
- **Quality ratings**: 0 (blackout) to 5 (perfect recall)
- **Interval calculation**:
  - First success: 1 day
  - Second success: 6 days
  - Subsequent: `interval × easiness_factor`
- **Mastery delta**: Quality-based linear scaling (±0.15 max per review)

## 📊 Curriculum Structure

The knowledge lattice forms a prerequisite chain:

```
stack-vs-heap (no prereqs)
├── ownership-move
│   └── raii-dropping
│       └── references-basics
│           ├── borrow-immutable
│           │   └── borrow-mutable
│           │       └── borrow-checker-rules
│           │           └── struct-ownership
└── struct-data
    └── struct-methods
        └── struct-ownership
```

Each node includes:
- **Bridge analogies**: Mental model connections to C++/Python
- **SRS metadata**: Review scheduling and performance tracking
- **Mastery score**: Progress from 0.0 to 1.0

## 🤖 AI Integration

### Google Gemini AI
- **API Key**: Set `VITE_GEMINI_API_KEY` in frontend environment
- **Error explanations**: Contextual feedback with language analogies
- **Fallback handling**: Graceful degradation when API unavailable

### Synthesis Engine
- **Triplet prompts**: Combines 3 related concepts into cohesive challenges
- **Feedback prompts**: Error-specific explanations using curriculum analogies
- **Language bridging**: Explains Rust concepts through familiar paradigms

## 🔒 Security & Best Practices

### Git Rules
- **No binary commits**: WASM files >10MB must not be committed
- **Clean builds**: `node_modules/`, `dist/`, binaries excluded
- **Environment variables**: API keys never committed

### Error Handling
- **API failures**: Frontend falls back to local calculation
- **Compilation errors**: Detailed Rust error extraction and mapping
- **Network issues**: Clear user feedback with retry options

### Performance
- **Lazy loading**: Components load only when needed
- **Efficient rendering**: React optimization with proper key props
- **Background processing**: Non-blocking API calls with loading states

## 🎯 Learning Flow

1. **Dashboard**: View mastery statistics and SRS queue
2. **Concept Selection**: Choose accessible concepts due for review
3. **Challenge Lab**: Interactive coding with real compiler feedback
4. **AI Assistance**: Get contextual help for compilation errors
5. **Progress Tracking**: Mastery updates based on performance
6. **Spaced Review**: Intelligent scheduling for long-term retention

## 🚀 Future Enhancements

- **Database integration**: Replace JSON files with PostgreSQL/MongoDB
- **User authentication**: Multi-user support with progress isolation
- **Advanced analytics**: Learning pattern analysis and recommendations
- **Mobile app**: React Native companion for on-the-go practice
- **Collaborative features**: Shared challenges and peer learning
- **Extended curriculum**: More advanced Rust concepts and ecosystems

---

Built with ❤️ for developers making the leap to Rust's ownership system.