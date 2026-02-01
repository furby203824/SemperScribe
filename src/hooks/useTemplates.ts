import { useState, useEffect, useMemo } from 'react';
import { getBasePath } from '@/lib/path-utils';

export interface Template {
  id: string;
  title: string;
  description?: string;
  unitName?: string;
  unitCode?: string;
  documentType?: string;
  url: string;
}

interface UseTemplatesProps {
  documentType?: string;
  currentUnitCode?: string;
  currentUnitName?: string;
}

export function useTemplates({ documentType, currentUnitCode, currentUnitName }: UseTemplatesProps) {
  const [globalTemplates, setGlobalTemplates] = useState<Template[]>([]);
  const [unitTemplates, setUnitTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | 'unit'>('global');

  useEffect(() => {
    const loadIndexes = async () => {
      try {
        setIsLoading(true);
        const basePath = getBasePath();
        const [g, u] = await Promise.all([
          fetch(`${basePath}/templates/global/index.json`).then(r => r.ok ? r.json() : []),
          fetch(`${basePath}/templates/unit/index.json`).then(r => r.ok ? r.json() : []),
        ]);
        setGlobalTemplates(Array.isArray(g) ? g : []);
        setUnitTemplates(Array.isArray(u) ? u : []);
      } catch (e) {
        setError('Failed to load template indexes');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadIndexes();
  }, []);

  const matchesQuery = (t: Template) => {
    // Filter by document type if specified
    if (documentType) {
      if (t.documentType && t.documentType !== documentType) {
        return false;
      }
      // If template has no type, assume 'basic'. Only show if looking for 'basic'
      if (!t.documentType && documentType !== 'basic') {
        return false;
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    // Search in title, description, unit name, unit code
    return [
      t.title, 
      t.description || '', 
      t.unitName || '', 
      t.unitCode || ''
    ].some(field => field.toLowerCase().includes(q));
  };

  const filteredGlobalTemplates = useMemo(() => {
    return globalTemplates.filter(matchesQuery);
  }, [globalTemplates, searchQuery, documentType]);

  const filteredUnitTemplates = useMemo(() => {
    let list = unitTemplates.filter(matchesQuery);
    
    // If searching, show all matching unit templates.
    // If NOT searching, maybe prioritize user's unit? 
    // The original logic had a toggle for "Match Selected Unit".
    // For now, we'll return all matching the search/type query.
    
    return list;
  }, [unitTemplates, searchQuery, documentType]);

  return {
    globalTemplates: filteredGlobalTemplates,
    unitTemplates: filteredUnitTemplates,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab
  };
}
