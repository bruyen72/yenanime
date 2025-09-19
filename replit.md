# Knight Bot - WhatsApp Business API Bot

## Overview
Knight Bot is a sophisticated WhatsApp business bot built with Node.js and the Baileys library. It provides a comprehensive web interface for connecting WhatsApp accounts and managing bot functionality. The bot includes advanced features like rate limiting, memory management, and extensive command support.

## Recent Changes
- **2025-09-19**: Successfully set up project in Replit environment
  - ✅ Upgraded to Node.js 20.19.3 for compatibility with latest dependencies
  - ✅ Configured web server to use port 5000 and bind to 0.0.0.0 for Replit
  - ✅ Updated API endpoints to match frontend expectations (/api/* routes)
  - ✅ Added comprehensive diagnostics and status endpoints
  - ✅ Set up VM deployment configuration for persistent WebSocket connections
  - ✅ Installed all system dependencies for Playwright (glib, nss, dbus, atk, etc)
  - ✅ Fixed ship command functionality by installing browser automation dependencies
  - ✅ Verified FFmpeg installation and functionality
  - ✅ All API endpoints tested and working (/api/status, /api/diagnostics, /api/pair, /api/qr)

## Project Architecture

### Core Components
- **Web Interface** (`public/index.html`): Modern HTML interface for WhatsApp connection
- **Web Server** (`server.js`): Express.js server handling API endpoints and static files
- **Bot Core** (`index.js`): Main WhatsApp bot initialization and connection handling
- **Message Handler** (`main.js`): Comprehensive message processing and command routing
- **Startup Script** (`start.js`): Combined launcher for web server and bot

### Key Features
- **Pairing Code Generation**: Web-based WhatsApp pairing without QR scanning
- **QR Code Support**: Alternative connection method with visual QR codes
- **Rate Limiting**: Advanced protection against WhatsApp bans
- **Memory Management**: Automatic garbage collection and memory monitoring
- **Command System**: 60+ bot commands for various functionalities
- **Group Management**: Admin controls, anti-link, anti-spam features
- **Media Processing**: Sticker creation, image processing, audio conversion

### API Endpoints
- `GET /` - Main web interface
- `GET /api/status` - Bot status and system information
- `GET /api/pair?number={phone}` - Generate pairing code for phone number
- `GET /api/qr` - Generate QR code for connection
- `GET /api/diagnostics` - Device compatibility and troubleshooting info

### Configuration
- **Port**: 5000 (configured for Replit)
- **Host**: 0.0.0.0 (allows proxy access)
- **Deployment**: VM target for persistent connections
- **Node.js**: Version 20.19.3 (installed and working)
- **Dependencies**: All installed and working
- **Playwright**: System dependencies installed for browser automation
- **FFmpeg**: Version 7.1.1 available for media processing
- **Memory Management**: Optimized for cloud environment (156MB usage)

## Development Notes
- Bot supports both interactive (command line) and web-based (interface) connections
- Memory usage monitored and optimized for cloud environments
- All API endpoints return JSON with consistent success/error format
- Frontend uses modern JavaScript with no external frameworks
- Rate limiting prevents excessive API calls that could cause bans

## User Preferences
- Web interface preferred over command-line for user connections
- Clean, modern UI with diagnostic capabilities
- Support for both mobile and desktop devices
- Comprehensive error handling and user guidance

## Running the Project
The project runs automatically via the configured workflow:
```bash
node start.js
```

Access the web interface at: `https://[replit-url]/`

The bot will be ready to accept WhatsApp connections through the web interface once users provide their phone numbers or scan QR codes.