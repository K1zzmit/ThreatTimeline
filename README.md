# ThreatTimeline

A visualization tool for mapping and analyzing attack lifecycles using MITRE ATT&CK framework. This interactive application helps security professionals and analysts to create, visualize, and analyze attack patterns and their progression over time.

## Features

- Interactive timeline visualization of attack events
![image](https://github.com/user-attachments/assets/55646593-209c-4f27-8b0c-5ecd69e1b00c)
- MITRE ATT&CK framework integration
![image](https://github.com/user-attachments/assets/7f6b3922-4c06-4c1f-97e3-9b9f7adace3f)
- Artifact tracking and relationship mapping
![image](https://github.com/user-attachments/assets/e9877af4-54e8-4f27-9c29-21a850e35844)
![image](https://github.com/user-attachments/assets/cb25f0d1-45a7-4321-8398-4af65142bbd9)
- Dynamic event management and editing
- Visual attack pattern analysis
- Export timeline as PNG or SVG
- Export timeline reports in Markdown format
- Lateral movement tracking and visualization
![image](https://github.com/user-attachments/assets/d9efe2f5-6933-453c-a0bb-2f3656ccba83)
- Multi-incident support
  
![image](https://github.com/user-attachments/assets/08a2e538-3166-45ee-a0a0-a6ef5bb2ad7d)

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- ReactFlow for visualizations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/K1zzmit/ThreatTimeline.git

# Navigate to project directory
cd ThreatTimeline

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`.

## Usage

1. Create new incidents and events using the timeline interface
2. Add MITRE ATT&CK tactics and techniques to events
3. Link artifacts and establish relationships between events
4. Track lateral movement between hosts
5. Visualize attack patterns and progression
6. Export timelines as PNG/SVG for reporting
7. Export reports in Markdown format

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This means:
- ✅ You can view and use the code
- ✅ You can modify the code
- ✅ You can distribute the code
- ❌ You cannot use it commercially without sharing your source code
- ❌ You cannot distribute it under a different license

Copyright (c) 2024 K1zzmit
