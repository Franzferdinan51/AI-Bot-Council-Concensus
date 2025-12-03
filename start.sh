#!/bin/bash

# AI Council Chamber MCP Server Startup Script

set -e

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MIN_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_INSTALL=false
SKIP_BUILD=false
DEV_MODE=false
CHECK_ONLY=false
LOAD_ENV=true
SETUP_MODE=false

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
AI Council Chamber MCP Server v${VERSION}

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -d, --dev               Run in development mode (tsx watch)
    -i, --skip-install      Skip npm install
    -b, --skip-build        Skip TypeScript build
    -c, --check-only        Only run checks, don't start server
    --no-env                Don't load .env file
    --node-version          Show required Node.js version
    -v, --version           Show version

Environment Variables:
    GEMINI_API_KEY          Google Gemini API key
    OPENROUTER_API_KEY      OpenRouter API key
    OLLAMA_ENDPOINT         Ollama endpoint (default: http://localhost:11434)
    LM_STUDIO_ENDPOINT      LM Studio endpoint (default: http://localhost:1234)
    GENERIC_OPENAI_KEY      Generic OpenAI-compatible API key
    GENERIC_OPENAI_ENDPOINT Generic OpenAI-compatible endpoint

Examples:
    $0                      Start server normally
    $0 -d                   Start in development mode
    $0 -i -b                Skip install and build (for testing)
    $0 -c                   Run checks only
    GEMINI_API_KEY=... $0   Start with API key

EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -d|--dev)
            DEV_MODE=true
            shift
            ;;
        -i|--skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -c|--check-only)
            CHECK_ONLY=true
            shift
            ;;
        --no-env)
            LOAD_ENV=false
            shift
            ;;
        --node-version)
            echo "Node.js ${NODE_MIN_VERSION} or higher required"
            exit 0
            ;;
        -v|--version)
            echo "AI Council MCP Server v${VERSION}"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            usage
            ;;
    esac
done

# Header
echo "=========================================="
echo "AI Council Chamber MCP Server v${VERSION}"
echo "=========================================="
echo ""

# Check Node.js version
check_node_version() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo ""
        echo "Please install Node.js ${NODE_MIN_VERSION} or higher:"
        echo "  https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
        print_error "Node.js version ${NODE_MIN_VERSION} or higher required"
        echo "Current version: $(node -v)"
        exit 1
    fi

    print_success "Node.js $(node -v) detected"
}

# Check for .env file
check_env_file() {
    if [ "$LOAD_ENV" = true ] && [ -f "$SCRIPT_DIR/.env" ]; then
        print_info "Loading environment variables from .env file"
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
        print_success ".env file loaded"
    fi
}

# Check dependencies
check_dependencies() {
    if [ "$SKIP_INSTALL" = false ]; then
        if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
            print_info "Installing dependencies..."
            cd "$SCRIPT_DIR"
            npm install
            if [ $? -eq 0 ]; then
                print_success "Dependencies installed"
            else
                print_error "Failed to install dependencies"
                exit 1
            fi
        else
            print_success "Dependencies already installed"
        fi
    else
        print_warning "Skipping dependency installation"
    fi
}

# Build TypeScript
build_typescript() {
    if [ "$SKIP_BUILD" = false ]; then
        if [ ! -d "$SCRIPT_DIR/dist" ] || [ "$DEV_MODE" = true ]; then
            print_info "Building TypeScript..."
            cd "$SCRIPT_DIR"
            npm run build
            if [ $? -eq 0 ]; then
                print_success "Build complete"
            else
                print_error "Build failed"
                if [ "$DEV_MODE" = true ]; then
                    print_info "Falling back to development mode..."
                else
                    exit 1
                fi
            fi
        else
            print_success "Build already exists"
        fi
    else
        print_warning "Skipping TypeScript build"
    fi
}

# Check API keys
check_api_keys() {
    local has_key=false

    if [ -n "$GEMINI_API_KEY" ]; then
        has_key=true
    elif [ -n "$OPENROUTER_API_KEY" ]; then
        has_key=true
    elif [ -n "$GENERIC_OPENAI_KEY" ]; then
        has_key=true
    elif [ -n "$OLLAMA_ENDPOINT" ]; then
        has_key=true
    elif [ -n "$LM_STUDIO_ENDPOINT" ]; then
        has_key=true
    fi

    if [ "$has_key" = false ]; then
        print_warning "No AI provider API keys configured"
        echo ""
        echo "Please set at least one provider:"
        echo "  export GEMINI_API_KEY=your_key              # Google Gemini"
        echo "  export OPENROUTER_API_KEY=your_key          # OpenRouter (Claude, GPT-4, etc.)"
        echo "  export OLLAMA_ENDPOINT=http://localhost:11434  # Local models"
        echo "  export LM_STUDIO_ENDPOINT=http://localhost:1234  # LM Studio"
        echo ""
        echo "Or create a .env file with these variables."
        echo ""
    else
        print_success "At least one AI provider configured"
    fi
}

# Check local AI services
check_local_services() {
    local services=()

    if [ -n "$OLLAMA_ENDPOINT" ]; then
        services+=("Ollama ($OLLAMA_ENDPOINT)")
    fi

    if [ -n "$LM_STUDIO_ENDPOINT" ]; then
        services+=("LM Studio ($LM_STUDIO_ENDPOINT)")
    fi

    if [ ${#services[@]} -gt 0 ]; then
        print_info "Configured local AI services:"
        for service in "${services[@]}"; do
            echo "  - $service"
        done
        echo ""
    fi
}

# Display configuration
show_configuration() {
    print_info "Configuration:"
    echo "  Mode: $([ "$DEV_MODE" = true ] && echo "Development" || echo "Production")"
    echo "  Node.js: $(node -v)"
    echo "  NPM: $(npm -v)"

    if [ -n "$GEMINI_API_KEY" ]; then
        echo "  Provider: Google Gemini ✓"
    elif [ -n "$OPENROUTER_API_KEY" ]; then
        echo "  Provider: OpenRouter ✓"
    elif [ -n "$GENERIC_OPENAI_KEY" ]; then
        echo "  Provider: Generic OpenAI-compatible ✓"
    else
        echo "  Provider: None configured"
    fi
    echo ""
}

# Main execution
main() {
    print_info "Starting AI Council Chamber MCP Server..."

    check_node_version
    check_env_file
    show_configuration

    if [ "$CHECK_ONLY" = true ]; then
        check_api_keys
        check_local_services
        print_success "All checks passed!"
        exit 0
    fi

    check_api_keys
    check_local_services

    check_dependencies
    build_typescript

    echo ""
    echo "=========================================="
    print_info "Starting MCP Server..."
    echo "=========================================="
    echo ""
    echo "Server will communicate via stdio (MCP protocol)"
    echo "Press Ctrl+C to stop"
    echo ""

    cd "$SCRIPT_DIR"

    # Start the server
    if [ "$DEV_MODE" = true ]; then
        print_info "Running in development mode..."
        npm run dev
    else
        npm start
    fi
}

# Trap Ctrl+C and exit gracefully
trap 'echo ""; print_info "Shutting down..."; exit 0' INT

# Run main function
main
