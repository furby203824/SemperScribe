import React from 'react';
import { AlertTriangle, Shield, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
          Welcome to Semper Scribe
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The professional standard for USMC correspondence. Create, format, and validate naval letters, endorsements, and messages with precision.
        </p>
      </div>

      {/* Disclaimers & Warnings - Prominent Display */}
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">Important Disclaimers</AlertTitle>
        <AlertDescription className="space-y-2 mt-2 text-sm">
          <p><strong>• UNCLASSIFIED USE ONLY:</strong> This tool is strictly for processing UNCLASSIFIED information. Do not input, process, or store Classified, CUI, or PII data on unauthorized systems.</p>
          <p><strong>• VERIFICATION REQUIRED:</strong> While Semper Scribe automates formatting, the final content is the responsibility of the originator. Always verify references and administrative details against current directives.</p>
          <p><strong>• BROWSER COMPATIBILITY:</strong> Optimized for modern browsers. Some legacy systems may experience rendering issues.</p>
        </AlertDescription>
      </Alert>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Standard Correspondence
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Generate standard Naval Letters, Endorsements, and Memorandums compliant with the Naval Correspondence Manual (SECNAV M-5216.5).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              AMHS Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Draft and format Automated Message Handling System (AMHS) messages (GENADMIN, MARADMIN) with automatic line wrapping and DTG generation.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Administrative Forms
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quickly populate common administrative forms like the AA Form (NAVMC 10274) and Administrative Remarks (Page 11).
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security & Privacy
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                All processing happens locally in your browser. No data is sent to external servers. Your drafts remain on your machine.
            </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-8">
        <p>Select a document type from the sidebar to begin.</p>
      </div>
    </div>
  );
}
