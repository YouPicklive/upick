import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface ParsedRow {
  name: string;
  category: string;
  description?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  price_level?: string;
  rating?: string;
  energy?: string;
  tags?: string;
  latitude?: string;
  longitude?: string;
  photo_url?: string;
  is_outdoor?: string;
  smoking_friendly?: string;
}

interface ImportResult {
  total: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

const REQUIRED_FIELDS = ['name'];
const OPTIONAL_FIELDS = [
  'category', 'description', 'neighborhood', 'city', 'state',
  'price_level', 'rating', 'energy', 'tags', 'latitude', 'longitude',
  'photo_url', 'is_outdoor', 'smoking_friendly',
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function toBool(val?: string): boolean {
  if (!val) return false;
  return ['true', '1', 'yes', 'y'].includes(val.toLowerCase());
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheckingRole(false);
      return;
    }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setCheckingRole(false);
      });
  }, [user, authLoading]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers: h, rows } = parseCSV(text);
      setHeaders(h);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const { headers: h, rows } = parseCSV(text);

      // Validate required columns
      const missing = REQUIRED_FIELDS.filter((f) => !h.includes(f));
      if (missing.length > 0) {
        setResult({ total: 0, inserted: 0, skipped: 0, errors: [`Missing required columns: ${missing.join(', ')}`] });
        setImporting(false);
        return;
      }

      const importResult: ImportResult = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

      // Batch insert in chunks of 50
      const BATCH = 50;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const records = batch
          .filter((r) => r.name?.trim())
          .map((r) => ({
            name: r.name.trim(),
            category: r.category?.trim() || 'activity',
            description: r.description?.trim() || null,
            neighborhood: r.neighborhood?.trim() || null,
            city: r.city?.trim() || 'Richmond',
            state: r.state?.trim() || 'VA',
            price_level: r.price_level?.trim() || null,
            rating: r.rating ? parseFloat(r.rating) || null : null,
            energy: r.energy?.trim() || 'moderate',
            tags: r.tags ? r.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : [],
            latitude: r.latitude ? parseFloat(r.latitude) || null : null,
            longitude: r.longitude ? parseFloat(r.longitude) || null : null,
            photo_url: r.photo_url?.trim() || null,
            is_outdoor: toBool(r.is_outdoor),
            smoking_friendly: toBool(r.smoking_friendly),
            active: true,
          }));

        if (records.length === 0) {
          importResult.skipped += batch.length;
          continue;
        }

        const { error, data } = await supabase.from('businesses').insert(records).select('id');
        if (error) {
          importResult.errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
          importResult.skipped += records.length;
        } else {
          importResult.inserted += data?.length || records.length;
        }
      }

      setResult(importResult);
      setImporting(false);
    };
    reader.readAsText(file);
  }, [file]);

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setHeaders([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Loading / auth guard
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-muted-foreground">Please sign in to access admin tools.</p>
        <Button variant="hero" onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground text-center">You don't have admin access.<br />Contact support if this is an error.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="font-display text-2xl font-bold mb-1">Business Manager</h1>
        <p className="text-muted-foreground text-sm mb-8">Upload a CSV to import businesses into the database.</p>

        {/* CSV Format Guide */}
        <div className="bg-muted/50 rounded-2xl p-5 mb-6 text-sm">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            CSV Format
          </h3>
          <p className="text-muted-foreground mb-2">
            <strong>Required:</strong> <code className="bg-background px-1.5 py-0.5 rounded text-xs">name</code>
          </p>
          <p className="text-muted-foreground">
            <strong>Optional:</strong>{' '}
            {OPTIONAL_FIELDS.map((f) => (
              <code key={f} className="bg-background px-1.5 py-0.5 rounded text-xs mr-1 mb-1 inline-block">{f}</code>
            ))}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Tags should be semicolon-separated (e.g. <code className="bg-background px-1 rounded">craft beer;live music;rooftop</code>).
            Booleans accept <code className="bg-background px-1 rounded">true/false/yes/no/1/0</code>.
          </p>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click or drag a CSV file here</p>
          )}
        </div>

        {/* Preview Table */}
        {preview && preview.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Preview (first 5 rows)</h3>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                        {h}
                        {REQUIRED_FIELDS.includes(h) && <span className="text-primary ml-1">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                          {row[h] || <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {file && !result && (
          <div className="mt-6">
            <Button variant="hero" size="lg" className="w-full" onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Businesses
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`mt-6 rounded-2xl p-5 ${result.errors.length > 0 ? 'bg-destructive/5 border border-destructive/20' : 'bg-success/5 border border-success/20'}`}>
            <div className="flex items-start gap-3">
              {result.errors.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {result.inserted} of {result.total} businesses imported
                  {result.skipped > 0 && ` (${result.skipped} skipped)`}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 text-xs text-destructive space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleClear}>
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
