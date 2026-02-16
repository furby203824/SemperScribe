# Semper Scribe

A professional-grade web application for creating, formatting, and exporting USMC correspondence and administrative documents. Built with Next.js, Semper Scribe helps Marines produce properly formatted documents compliant with SECNAV M-5216.5 and MCO 5215.1K.

**Live Demo:** [https://furby203824.github.io/SemperScribe](https://furby203824.github.io/SemperScribe)

## Features

### Document Types

| Type | Description |
|------|-------------|
| **Basic Letter** | Standard naval correspondence format |
| **Endorsement** | First through fourth endorsements with automatic routing |
| **MCO (Marine Corps Order)** | Directives with distribution statements and reports required |
| **Bulletin** | Time-limited directives (MCBul format) |
| **AMHS Message** | GENADMIN/MARADMIN messages with DTG, references, and POC sections |
| **AA Form (NAVMC 10274)** | Administrative Action form |
| **Page 11** | Administrative Remarks (NAVMC 118-11) |

### Core Capabilities

- **Live Preview** - Real-time document preview as you type (desktop) or via modal (mobile)
- **PDF Export** - Generate print-ready PDFs with proper formatting
- **DOCX Export** - Export to Microsoft Word format
- **AMHS Text Export** - Plain text export for AMHS message systems
- **Shareable Links** - Generate links that encode the full document state for sharing/collaboration
- **Templates** - Pre-built templates for common document types
- **Draft Saving** - Auto-save drafts to browser local storage
- **NLDP Import/Export** - Naval Letter Data Package format for portable document data

### AMHS Message Features

- Auto-generated Date-Time Group (DTG) in Zulu time with refresh button
- Reference management with letter designators (a), (b), (c)...
- NARR (Narrative) auto-generation from references
- POC (Point of Contact) manager with email and phone fields
- Smart paragraph insertion with proper numbering
- Message validation before export
- Terminal-style preview (green text on black background)

### Mobile Support

- Responsive design for all screen sizes
- Mobile preview modal (slide-up sheet)
- Touch-friendly form controls

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/furby203824/SemperScribe.git
cd SemperScribe

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── amhs/              # AMHS message components
│   ├── layout/            # App shell, sidebar, header
│   ├── letter/            # Letter section components
│   ├── pdf/               # PDF generation components
│   └── ui/                # Reusable UI components (shadcn/ui)
├── hooks/                 # React hooks
├── lib/                   # Utilities and helpers
│   ├── schemas.ts         # Document type definitions
│   ├── pdf-generator.ts   # PDF generation logic
│   ├── docx-generator.ts  # DOCX generation logic
│   ├── url-state.ts       # Shareable link encoding
│   └── ...
├── services/
│   ├── amhs/              # AMHS formatter service
│   └── pdf/               # PDF generation services
└── types/                 # TypeScript type definitions
```

## Document Sections

### Standard Letters

- **Unit Information** - SSIC, originator code, date, from/to lines
- **Subject Line** - Auto-capitalized subject
- **References** - Lettered reference list with structured input
- **Enclosures** - Numbered enclosure list
- **Via Chain** - Routing through intermediate commands
- **Body Paragraphs** - Multi-level paragraph support (1., 1.a., 1.a.(1), etc.)
- **Closing Block** - Signature, name, title, copy-to distribution

### Directives (MCO/Bulletin)

All standard letter sections plus:
- **Distribution Statement** - A through F with descriptions
- **Administrative Subsections** - Auto-injected Records Management, Privacy Act, and Reports Required sections
- **Reports Required** - Report tracking with RCS symbols
- **Cancellation Date** - For bulletins

### AMHS Messages

- **Message Type & Classification** - GENADMIN, MARADMIN, etc.
- **Date-Time Group** - Auto-generated with manual override
- **Header** - FROM, SUBJ fields
- **References** - With document identifiers
- **Narrative (NARR)** - Auto-generated or manual
- **Message Body** - With smart paragraph insertion
- **Point of Contact** - Name, phone, email

## NAVMC 10274 (AA Form) Setup

To use the AA Form feature, you must provide the official PDF templates:

1. Obtain the NAVMC 10274 PDF
2. Split it into three files:
   - `page1.pdf` - Cover/instruction sheet
   - `page2.pdf` - Main form page
   - `page3.pdf` - Continuation sheet
3. Place files in `public/templates/navmc10274/`

## Security & Privacy

- **Client-Side Processing** - All document processing happens locally in your browser
- **No Server Storage** - No data is transmitted to external servers
- **Local Drafts** - Saved drafts are stored in browser localStorage only
- **Shareable Links** - Document data is compressed and encoded in the URL itself

## Disclaimers

> **UNCLASSIFIED USE ONLY:** This tool is strictly for processing UNCLASSIFIED information. Do not input, process, or store Classified, CUI, or PII data.

> **VERIFICATION REQUIRED:** While Semper Scribe automates formatting, the final content is the responsibility of the originator. Always verify references and administrative details against current directives.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **PDF Generation:** @react-pdf/renderer, pdf-lib
- **DOCX Generation:** docx
- **Form Validation:** Zod, React Hook Form
- **State Management:** React useState/useCallback
- **Compression:** lz-string (for shareable links)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is provided as-is for educational and official use within the USMC community.

---

*Semper Fidelis*
