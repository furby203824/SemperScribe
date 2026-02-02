import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, UserPlus } from 'lucide-react';

interface POCManagerProps {
  pocs: string[];
  onChange: (pocs: string[]) => void;
}

export function POCManager({ pocs, onChange }: POCManagerProps) {
  // We'll manage local state for the "Add New POC" form
  const [name, setName] = useState('');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');

  const addPOC = () => {
    if (!name || !phone) return; // Basic validation

    // Format: NAME/RANK/UNIT/TEL: NUMBER
    // We filter out empty fields to avoid extra slashes if e.g. Unit is missing
    const parts = [
      name.toUpperCase(),
      rank.toUpperCase(),
      unit.toUpperCase(),
      phone.toUpperCase().startsWith('TEL:') ? phone.toUpperCase() : `TEL: ${phone.toUpperCase()}`
    ].filter(p => p && p.trim().length > 0);

    const pocString = parts.join('/');
    onChange([...pocs, pocString]);
    
    // Reset form
    setName('');
    setRank('');
    setUnit('');
    setPhone('');
  };

  const removePOC = (index: number) => {
    const newPocs = pocs.filter((_, i) => i !== index);
    onChange(newPocs);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg">Points of Contact (POC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/20">
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="poc-rank" className="text-xs">Rank/Grade</Label>
            <Input
              id="poc-rank"
              placeholder="CAPT"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="poc-name" className="text-xs">Name</Label>
            <Input
              id="poc-name"
              placeholder="J. M. DOE"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="poc-unit" className="text-xs">Unit/Office</Label>
            <Input
              id="poc-unit"
              placeholder="HQMC AR"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="poc-phone" className="text-xs">Phone/Email</Label>
            <div className="flex gap-2">
              <Input
                id="poc-phone"
                placeholder="703-555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={addPOC} size="icon" disabled={!name || !phone}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {pocs.length === 0 && (
            <div className="text-center text-muted-foreground py-2 text-sm">
              No points of contact added.
            </div>
          )}
          
          {pocs.map((poc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded bg-card/50 font-mono text-sm">
              <span>{poc}</span>
              <Button variant="ghost" size="sm" onClick={() => removePOC(index)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
