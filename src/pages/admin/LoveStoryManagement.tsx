import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWeddingContent, LoveStory } from '@/hooks/useWeddingContent';
import { useToast } from '@/hooks/use-toast';
import { 
  HeartIcon,
  PlusIcon,
  TrashIcon,
  Save,
  Eye
} from 'lucide-react';

const LoveStoryManagement = () => {
  const { loveStory, isLoading, updateLoveStory } = useWeddingContent();
  const [formData, setFormData] = useState<Partial<LoveStory>>(loveStory || {});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update form data when loveStory loads
  React.useEffect(() => {
    if (loveStory) {
      setFormData(loveStory);
    }
  }, [loveStory]);

  const handleInputChange = (field: keyof LoveStory, value: string | boolean | any[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimelineItemChange = (index: number, field: string, value: string) => {
    const newTimelineItems = [...(formData.timeline_items || [])];
    newTimelineItems[index] = {
      ...newTimelineItems[index],
      [field]: value
    };
    handleInputChange('timeline_items', newTimelineItems);
  };

  const addTimelineItem = () => {
    const newItem = {
      year: new Date().getFullYear().toString(),
      title: '',
      description: ''
    };
    handleInputChange('timeline_items', [...(formData.timeline_items || []), newItem]);
  };

  const removeTimelineItem = (index: number) => {
    const newTimelineItems = (formData.timeline_items || []).filter((_, i) => i !== index);
    handleInputChange('timeline_items', newTimelineItems);
  };

  const handleSave = async () => {
    if (!loveStory) return;

    setIsSaving(true);
    try {
      await updateLoveStory(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan kisah cinta",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    window.open('/#couple', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading love story...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Kisah Cinta</h1>
          <p className="text-muted-foreground">Kelola cerita perjalanan cinta pasangan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Save className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5" />
            Kisah Cinta
          </CardTitle>
          <CardDescription>
            Kelola konten kisah cinta yang ditampilkan di website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Tampilkan Section</Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menampilkan section kisah cinta di website
              </p>
            </div>
            <Switch
              checked={formData.is_visible || false}
              onCheckedChange={(checked) => handleInputChange('is_visible', checked)}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Section</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Kisah Cinta Kami"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Dua hati yang bersatu dalam cinta dan komitmen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Pertemuan pertama kami di kampus pada tahun 2019..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_story">Cerita Lengkap</Label>
              <Textarea
                id="full_story"
                value={formData.full_story || ''}
                onChange={(e) => handleInputChange('full_story', e.target.value)}
                placeholder="Cerita lengkap perjalanan cinta kalian..."
                rows={6}
              />
            </div>
          </div>

          {/* Timeline Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Timeline Kisah Cinta</Label>
              <Button variant="outline" size="sm" onClick={addTimelineItem}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Timeline
              </Button>
            </div>

            <div className="space-y-4">
              {(formData.timeline_items || []).map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Timeline Item {index + 1}</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeTimelineItem(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tahun</Label>
                      <Input
                        value={item.year}
                        onChange={(e) => handleTimelineItemChange(index, 'year', e.target.value)}
                        placeholder="2019"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Judul</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => handleTimelineItemChange(index, 'title', e.target.value)}
                        placeholder="Pertemuan Pertama"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleTimelineItemChange(index, 'description', e.target.value)}
                        placeholder="Di kampus, takdir mempertemukan kami"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData.timeline_items || formData.timeline_items.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                  <HeartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada timeline. Tambahkan timeline pertama!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoveStoryManagement;