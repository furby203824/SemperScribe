'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, User, Paintbrush, FileText, Radio, Database, Trash2 } from 'lucide-react';
import { UserProfile, resolveUnit } from '@/hooks/useUserProfile';
import { UNITS } from '@/lib/units';
import { useTheme } from 'next-themes';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onClearProfile: () => void;
  savedLetterCount: number;
  onClearSavedLetters: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  profile,
  onUpdateProfile,
  onClearProfile,
  savedLetterCount,
  onClearSavedLetters,
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [unitSearchOpen, setUnitSearchOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  const selectedUnit = profile.unitRuc
    ? UNITS.find(u => u.ruc === profile.unitRuc)
    : null;

  const filteredUnits = unitSearchQuery.length > 1
    ? UNITS.filter(unit =>
        unit.unitName.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
        unit.ruc.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
        unit.mcc.toLowerCase().includes(unitSearchQuery.toLowerCase())
      ).slice(0, 50)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card border-border p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-foreground">Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-2 grid w-auto grid-cols-4 bg-muted">
            <TabsTrigger value="profile" className="text-xs gap-1"><User className="w-3 h-3" />Profile</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1"><Paintbrush className="w-3 h-3" />Appearance</TabsTrigger>
            <TabsTrigger value="formatting" className="text-xs gap-1"><FileText className="w-3 h-3" />Formatting</TabsTrigger>
            <TabsTrigger value="data" className="text-xs gap-1"><Database className="w-3 h-3" />Data</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* ── Profile Tab ── */}
            <TabsContent value="profile" className="mt-4 space-y-6">
              <p className="text-sm text-muted-foreground">
                These fields auto-fill into every new document so you don't have to retype them.
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Unit</h3>
                {selectedUnit ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-primary">{selectedUnit.unitName}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => onUpdateProfile({ unitRuc: '' })}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="text-xs text-foreground/80">{selectedUnit.streetAddress}, {selectedUnit.cityState} {selectedUnit.zip}</div>
                    <Badge variant="secondary" className="text-[10px] h-5">RUC: {selectedUnit.ruc}</Badge>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground border-dashed"
                    onClick={() => setUnitSearchOpen(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search for your unit...
                  </Button>
                )}
                {selectedUnit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUnitSearchOpen(true)}
                  >
                    Change Unit
                  </Button>
                )}

                {/* Unit search sub-dialog */}
                <Dialog open={unitSearchOpen} onOpenChange={setUnitSearchOpen}>
                  <DialogContent className="sm:max-w-[600px] flex flex-col h-[70vh] bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Search className="w-5 h-5 text-primary" />
                        Search Units
                      </DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Search by Name, RUC, or MCC..."
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      className="bg-background border-input"
                      autoFocus
                    />
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-4">
                        {unitSearchQuery.length > 1 && filteredUnits.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No units found matching &quot;{unitSearchQuery}&quot;
                          </div>
                        )}
                        {filteredUnits.map((unit) => (
                          <button
                            key={`${unit.ruc}-${unit.mcc}`}
                            onClick={() => {
                              onUpdateProfile({ unitRuc: unit.ruc });
                              setUnitSearchOpen(false);
                              setUnitSearchQuery('');
                            }}
                            className="w-full text-left p-3 rounded-lg hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20 flex flex-col gap-1 group"
                          >
                            <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {unit.unitName}
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-2">
                              <Badge variant="secondary" className="text-[10px] h-5">RUC: {unit.ruc}</Badge>
                              <Badge variant="outline" className="text-[10px] h-5">MCC: {unit.mcc}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {unit.streetAddress}, {unit.cityState} {unit.zip}
                            </div>
                          </button>
                        ))}
                        {unitSearchQuery.length <= 1 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Type at least 2 characters to search...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Signature Name</Label>
                    <Input
                      value={profile.fullName}
                      onChange={(e) => onUpdateProfile({ fullName: e.target.value.toUpperCase() })}
                      placeholder="F. M. LASTNAME"
                      className="bg-background border-input uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">Auto-fills the signature block</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">From Title</Label>
                    <Input
                      value={profile.fromTitle}
                      onChange={(e) => onUpdateProfile({ fromTitle: e.target.value })}
                      placeholder="e.g. Commanding Officer"
                      className="bg-background border-input"
                    />
                    <p className="text-[10px] text-muted-foreground">Auto-fills the "From" field</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Originator Code</Label>
                    <Input
                      value={profile.officeCode}
                      onChange={(e) => onUpdateProfile({ officeCode: e.target.value })}
                      placeholder="e.g. G-1"
                      className="bg-background border-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Rank</Label>
                    <Input
                      value={profile.rank}
                      onChange={(e) => onUpdateProfile({ rank: e.target.value })}
                      placeholder="e.g. Major"
                      className="bg-background border-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                    <Input
                      value={profile.title}
                      onChange={(e) => onUpdateProfile({ title: e.target.value })}
                      placeholder="e.g. Operations Officer"
                      className="bg-background border-input"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Appearance Tab ── */}
            <TabsContent value="appearance" className="mt-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Theme</h3>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                  >
                    System
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Formatting Tab ── */}
            <TabsContent value="formatting" className="mt-4 space-y-6">
              <p className="text-sm text-muted-foreground">
                Default formatting for new documents. Can still be changed per-document in the form.
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Document Defaults</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Header Type</Label>
                    <Select
                      value={profile.headerType}
                      onValueChange={(val) => onUpdateProfile({ headerType: val as 'USMC' | 'DON' })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USMC">USMC Standard</SelectItem>
                        <SelectItem value="DON">Department of the Navy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Body Font</Label>
                    <Select
                      value={profile.bodyFont}
                      onValueChange={(val) => onUpdateProfile({ bodyFont: val as 'times' | 'courier' })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="times">Times New Roman</SelectItem>
                        <SelectItem value="courier">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Header Color</Label>
                    <Select
                      value={profile.accentColor}
                      onValueChange={(val) => onUpdateProfile({ accentColor: val as 'black' | 'blue' })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">AMHS Defaults</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Classification</Label>
                    <Select
                      value={profile.amhsClassification}
                      onValueChange={(val) => onUpdateProfile({ amhsClassification: val })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNCLASSIFIED">UNCLASSIFIED</SelectItem>
                        <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
                        <SelectItem value="SECRET">SECRET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Precedence</Label>
                    <Select
                      value={profile.amhsPrecedence}
                      onValueChange={(val) => onUpdateProfile({ amhsPrecedence: val })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                        <SelectItem value="PRIORITY">PRIORITY</SelectItem>
                        <SelectItem value="IMMEDIATE">IMMEDIATE</SelectItem>
                        <SelectItem value="FLASH">FLASH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Data Tab ── */}
            <TabsContent value="data" className="mt-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Saved Drafts</h3>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm text-foreground">{savedLetterCount} saved draft{savedLetterCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Stored in browser localStorage</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={savedLetterCount === 0}
                    onClick={() => {
                      if (window.confirm('Delete all saved drafts? This cannot be undone.')) {
                        onClearSavedLetters();
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Disclaimer</h3>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm text-foreground">Disclaimer notice</p>
                    <p className="text-xs text-muted-foreground">Show the disclaimer dialog again on next load</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('hasSeenDisclaimer');
                      onOpenChange(false);
                      window.location.reload();
                    }}
                  >
                    Re-show
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Profile</h3>
                <div className="flex items-center justify-between rounded-md border border-destructive/20 p-3 bg-destructive/5">
                  <div>
                    <p className="text-sm text-foreground">Reset all settings</p>
                    <p className="text-xs text-muted-foreground">Clears your saved profile and formatting defaults</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Reset all settings to defaults? Your profile info will be cleared.')) {
                        onClearProfile();
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
