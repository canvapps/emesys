import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useThemeManager, ThemeConfig } from '@/hooks/useThemeManager';
import { useToast } from '@/hooks/use-toast';
import { 
  PaintBrushIcon,
  SwatchIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  CogIcon,
  SparklesIcon,
  BookmarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Save, Copy, Download, Upload, Palette, Monitor, AlertTriangle } from 'lucide-react';
import ThemePreview from './ThemePreview';

const ThemeEditor = () => {
  const {
    themes,
    currentTheme,
    isDefaultMode,
    isDarkMode,
    activateTheme,
    updateTheme,
    createTheme,
    deleteTheme,
    resetToDefault,
    toggleDarkMode,
    exportTheme,
    importTheme,
  } = useThemeManager();

  const [editingTheme, setEditingTheme] = useState<ThemeConfig>(currentTheme);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  const { toast } = useToast();

  const handleThemeChange = (section: keyof ThemeConfig, field: string, value: any) => {
    if (editingTheme.isDefault) {
      toast({
        title: "Tema default dilindungi",
        description: "Buat tema baru untuk melakukan kustomisasi",
        variant: "destructive",
      });
      return;
    }

    setEditingTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      },
      updatedAt: new Date().toISOString()
    }));
    setIsEditing(true);
  };

  const handleColorChange = (colorKey: string, value: string) => {
    handleThemeChange('colors', colorKey, value);
  };

  const handleSaveTheme = () => {
    if (editingTheme.isDefault) {
      toast({
        title: "Tidak dapat mengubah tema default",
        description: "Tema default dilindungi dan tidak dapat dimodifikasi",
        variant: "destructive",
      });
      return;
    }

    updateTheme(editingTheme);
    setIsEditing(false);
  };

  const handleApplyTheme = () => {
    activateTheme(editingTheme);
    setIsEditing(false);
  };

  const handleCreateNewTheme = () => {
    if (!newThemeName.trim()) {
      toast({
        title: "Error",
        description: "Nama tema harus diisi",
        variant: "destructive",
      });
      return;
    }

    const newTheme = createTheme({
      name: newThemeName,
      description: newThemeDescription,
      colors: { ...currentTheme.colors },
      typography: { ...currentTheme.typography },
      layout: { ...currentTheme.layout },
      effects: { ...currentTheme.effects },
      components: { ...currentTheme.components },
      darkMode: { ...currentTheme.darkMode },
      isActive: false,
      isDefault: false,
    });

    setEditingTheme(newTheme);
    setIsCreateDialogOpen(false);
    setNewThemeName('');
    setNewThemeDescription('');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importTheme(file);
    }
  };

  const convertHslToHex = (hsl: string) => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l / 100 - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const convertHexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const l = Math.round((sum / 2) * 100);
    const s = diff === 0 ? 0 : Math.round((diff / (1 - Math.abs(2 * l / 100 - 1))) * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
    { key: 'primaryGlow', label: 'Primary Glow', description: 'Glow effect color' },
    { key: 'secondary', label: 'Secondary Color', description: 'Secondary brand color' },
    { key: 'accent', label: 'Accent Color', description: 'Accent highlights' },
    { key: 'roseGold', label: 'Rose Gold', description: 'Special accent color' },
    { key: 'background', label: 'Background', description: 'Page background' },
    { key: 'card', label: 'Card Background', description: 'Card background color' },
    { key: 'text', label: 'Text Color', description: 'Primary text color' },
    { key: 'muted', label: 'Muted Text', description: 'Secondary text color' },
    { key: 'border', label: 'Border Color', description: 'Border and divider color' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Management</h1>
          <p className="text-muted-foreground">
            Kelola tema dan desain website pernikahan dengan kontrol penuh
          </p>
          <div className="flex items-center gap-2 mt-2">
            {isDefaultMode ? (
              <Badge variant="secondary" className="gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Default Mode (Protected)
              </Badge>
            ) : (
              <Badge variant="default" className="gap-2">
                <SparklesIcon className="h-4 w-4" />
                Custom Theme Active: {currentTheme.name}
              </Badge>
            )}
            <Badge variant="outline" className="gap-2">
              {isDarkMode ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleDarkMode}>
            {isDarkMode ? <SunIcon className="h-4 w-4 mr-2" /> : <MoonIcon className="h-4 w-4 mr-2" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button variant="outline" onClick={resetToDefault}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Reset Default
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Buat Tema Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Tema Baru</DialogTitle>
                <DialogDescription>
                  Buat tema kustom baru berdasarkan tema saat ini
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-name">Nama Tema</Label>
                  <Input
                    id="theme-name"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Masukkan nama tema"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-description">Deskripsi</Label>
                  <Textarea
                    id="theme-description"
                    value={newThemeDescription}
                    onChange={(e) => setNewThemeDescription(e.target.value)}
                    placeholder="Deskripsi tema (opsional)"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateNewTheme}>
                    Buat Tema
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Theme Selection Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SwatchIcon className="h-5 w-5" />
              Pilih Tema
            </CardTitle>
            <CardDescription>
              Pilih tema untuk dikustomisasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    editingTheme.id === theme.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                  }`}
                  onClick={() => {
                    setEditingTheme(theme);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-sm">{theme.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {theme.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                      {currentTheme.id === theme.id && !isDefaultMode && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {isDefaultMode && theme.isDefault && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex gap-1 mb-3">
                    {['primary', 'secondary', 'accent', 'roseGold'].map((colorKey) => (
                      <div 
                        key={colorKey}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ 
                          backgroundColor: `hsl(${theme.colors[colorKey as keyof typeof theme.colors]})` 
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        activateTheme(theme);
                      }}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    {!theme.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Hapus tema "${theme.name}"?`)) {
                            deleteTheme(theme.id);
                          }
                        }}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Import/Export */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => exportTheme(editingTheme)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Tema
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Tema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PaintBrushIcon className="h-5 w-5" />
                  Editor: {editingTheme.name}
                  {editingTheme.isDefault && (
                    <Badge variant="secondary">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {editingTheme.isDefault 
                    ? "Tema default dilindungi dan tidak dapat dimodifikasi. Buat tema baru untuk kustomisasi."
                    : "Kustomisasi warna, tipografi, dan efek visual"
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditing && !editingTheme.isDefault && (
                  <Button onClick={handleSaveTheme}>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                )}
                {!editingTheme.isDefault && (
                  <Button
                    variant="outline"
                    onClick={handleApplyTheme}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Terapkan
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open('/', '_blank')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
            
            {/* Warning for default theme */}
            {editingTheme.isDefault && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Tema default dilindungi. Buat tema baru untuk melakukan kustomisasi.
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.map(({ key, label, description }) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label}</Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          type="color"
                          value={convertHslToHex(editingTheme.colors[key as keyof typeof editingTheme.colors])}
                          onChange={(e) => handleColorChange(key, convertHexToHsl(e.target.value))}
                          className="w-16 h-10"
                          disabled={editingTheme.isDefault}
                        />
                        <Input
                          value={editingTheme.colors[key as keyof typeof editingTheme.colors]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="flex-1"
                          placeholder="HSL format: 45 95% 58%"
                          disabled={editingTheme.isDefault}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dark Mode Colors */}
                {editingTheme.darkMode.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MoonIcon className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Dark Mode Colors</h3>
                      <Switch
                        checked={editingTheme.darkMode.enabled}
                        onCheckedChange={(checked) => handleThemeChange('darkMode', 'enabled', checked)}
                        disabled={editingTheme.isDefault}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(editingTheme.darkMode.colors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={`dark-${key}`}>Dark {key}</Label>
                          <div className="flex gap-2">
                            <Input
                              id={`dark-${key}`}
                              type="color"
                              value={convertHslToHex(value)}
                              onChange={(e) => {
                                const newDarkColors = {
                                  ...editingTheme.darkMode.colors,
                                  [key]: convertHexToHsl(e.target.value)
                                };
                                handleThemeChange('darkMode', 'colors', newDarkColors);
                              }}
                              className="w-16 h-10"
                              disabled={editingTheme.isDefault}
                            />
                            <Input
                              value={value}
                              onChange={(e) => {
                                const newDarkColors = {
                                  ...editingTheme.darkMode.colors,
                                  [key]: e.target.value
                                };
                                handleThemeChange('darkMode', 'colors', newDarkColors);
                              }}
                              className="flex-1"
                              placeholder="HSL format"
                              disabled={editingTheme.isDefault}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="typography" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select 
                      value={editingTheme.typography.fontFamily} 
                      onValueChange={(value) => handleThemeChange('typography', 'fontFamily', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headingFont">Heading Font</Label>
                    <Select 
                      value={editingTheme.typography.headingFont} 
                      onValueChange={(value) => handleThemeChange('typography', 'headingFont', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                        <SelectItem value="Merriweather">Merriweather</SelectItem>
                        <SelectItem value="Crimson Text">Crimson Text</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select 
                      value={editingTheme.typography.fontSize} 
                      onValueChange={(value) => handleThemeChange('typography', 'fontSize', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14px">14px (Small)</SelectItem>
                        <SelectItem value="15px">15px</SelectItem>
                        <SelectItem value="16px">16px (Default)</SelectItem>
                        <SelectItem value="17px">17px</SelectItem>
                        <SelectItem value="18px">18px (Large)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lineHeight">Line Height</Label>
                    <Select 
                      value={editingTheme.typography.lineHeight} 
                      onValueChange={(value) => handleThemeChange('typography', 'lineHeight', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.4">1.4 (Tight)</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="1.6">1.6 (Default)</SelectItem>
                        <SelectItem value="1.7">1.7</SelectItem>
                        <SelectItem value="1.8">1.8 (Loose)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="layout" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="borderRadius">Border Radius</Label>
                    <Select 
                      value={editingTheme.layout.borderRadius} 
                      onValueChange={(value) => handleThemeChange('layout', 'borderRadius', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.25rem">0.25rem (Sharp)</SelectItem>
                        <SelectItem value="0.5rem">0.5rem (Subtle)</SelectItem>
                        <SelectItem value="1rem">1rem (Default)</SelectItem>
                        <SelectItem value="1.5rem">1.5rem (Rounded)</SelectItem>
                        <SelectItem value="2rem">2rem (Very Rounded)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="spacing">Spacing Scale</Label>
                    <Select 
                      value={editingTheme.layout.spacing} 
                      onValueChange={(value) => handleThemeChange('layout', 'spacing', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1rem">1rem (Compact)</SelectItem>
                        <SelectItem value="1.5rem">1.5rem (Default)</SelectItem>
                        <SelectItem value="2rem">2rem (Spacious)</SelectItem>
                        <SelectItem value="2.5rem">2.5rem (Luxurious)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectionPadding">Section Padding</Label>
                    <Select 
                      value={editingTheme.layout.sectionPadding} 
                      onValueChange={(value) => handleThemeChange('layout', 'sectionPadding', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3rem">3rem (Compact)</SelectItem>
                        <SelectItem value="4rem">4rem</SelectItem>
                        <SelectItem value="5rem">5rem (Default)</SelectItem>
                        <SelectItem value="6rem">6rem</SelectItem>
                        <SelectItem value="8rem">8rem (Spacious)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shadowStyle">Shadow Style</Label>
                    <Select 
                      value={editingTheme.effects.shadowStyle} 
                      onValueChange={(value) => handleThemeChange('effects', 'shadowStyle', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gradientStyle">Gradient Style</Label>
                    <Select 
                      value={editingTheme.effects.gradientStyle} 
                      onValueChange={(value) => handleThemeChange('effects', 'gradientStyle', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="animationSpeed">Animation Speed</Label>
                    <Select 
                      value={editingTheme.effects.animationSpeed} 
                      onValueChange={(value) => handleThemeChange('effects', 'animationSpeed', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="instant">Instant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blurIntensity">Blur Intensity</Label>
                    <Select 
                      value={editingTheme.effects.blurIntensity} 
                      onValueChange={(value) => handleThemeChange('effects', 'blurIntensity', value)}
                      disabled={editingTheme.isDefault}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Component Styles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Component Styles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buttonStyle">Button Style</Label>
                      <Select 
                        value={editingTheme.components.buttonStyle} 
                        onValueChange={(value) => handleThemeChange('components', 'buttonStyle', value)}
                        disabled={editingTheme.isDefault}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="elegant">Elegant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardStyle">Card Style</Label>
                      <Select 
                        value={editingTheme.components.cardStyle} 
                        onValueChange={(value) => handleThemeChange('components', 'cardStyle', value)}
                        disabled={editingTheme.isDefault}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="elevated">Elevated</SelectItem>
                          <SelectItem value="elegant">Elegant</SelectItem>
                          <SelectItem value="romantic">Romantic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="navStyle">Navigation Style</Label>
                      <Select 
                        value={editingTheme.components.navStyle} 
                        onValueChange={(value) => handleThemeChange('components', 'navStyle', value)}
                        disabled={editingTheme.isDefault}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="floating">Floating</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Live Preview</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/', '_blank')}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Full Preview
                    </Button>
                    {!editingTheme.isDefault && (
                      <Button
                        size="sm"
                        onClick={() => activateTheme(editingTheme)}
                      >
                        <BookmarkIcon className="h-4 w-4 mr-2" />
                        Apply Theme
                      </Button>
                    )}
                  </div>
                </div>
                
                <ThemePreview theme={editingTheme} isDarkMode={isDarkMode} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeEditor;