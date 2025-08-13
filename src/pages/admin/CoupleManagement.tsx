import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeddingContent, CoupleInfo } from '@/hooks/useWeddingContent';
import { useToast } from '@/hooks/use-toast';
import { 
  UserIcon, 
  HeartIcon,
  CameraIcon,
  Save,
  Eye
} from 'lucide-react';

const CoupleManagement = () => {
  const { coupleInfo, isLoading, updateCoupleInfo } = useWeddingContent();
  const [formData, setFormData] = useState<Partial<CoupleInfo>>(coupleInfo || {});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update form data when coupleInfo loads
  React.useEffect(() => {
    if (coupleInfo) {
      setFormData(coupleInfo);
    }
  }, [coupleInfo]);

  const handleInputChange = (field: keyof CoupleInfo, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!coupleInfo) return;

    setIsSaving(true);
    try {
      await updateCoupleInfo(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan informasi mempelai",
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
        <span className="ml-2">Loading couple information...</span>
      </div>
    );
  }

  if (!coupleInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couple Information</CardTitle>
          <CardDescription>No couple information found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Mempelai</h1>
          <p className="text-muted-foreground">Kelola informasi dan profil mempelai</p>
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

      <Tabs defaultValue="groom" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groom" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Mempelai Pria
          </TabsTrigger>
          <TabsTrigger value="bride" className="flex items-center gap-2">
            <HeartIcon className="h-4 w-4" />
            Mempelai Wanita
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Informasi Mempelai Pria
              </CardTitle>
              <CardDescription>
                Kelola informasi dan profil mempelai pria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groom_name">Nama Panggilan</Label>
                  <Input
                    id="groom_name"
                    value={formData.groom_name || ''}
                    onChange={(e) => handleInputChange('groom_name', e.target.value)}
                    placeholder="Dhika"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groom_full_name">Nama Lengkap</Label>
                  <Input
                    id="groom_full_name"
                    value={formData.groom_full_name || ''}
                    onChange={(e) => handleInputChange('groom_full_name', e.target.value)}
                    placeholder="Dhika Pratama"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groom_parents">Nama Orang Tua</Label>
                <Input
                  id="groom_parents"
                  value={formData.groom_parents || ''}
                  onChange={(e) => handleInputChange('groom_parents', e.target.value)}
                  placeholder="Bapak Suyanto & Ibu Siti Aminah"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groom_profession">Profesi</Label>
                  <Input
                    id="groom_profession"
                    value={formData.groom_profession || ''}
                    onChange={(e) => handleInputChange('groom_profession', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groom_education">Pendidikan</Label>
                  <Input
                    id="groom_education"
                    value={formData.groom_education || ''}
                    onChange={(e) => handleInputChange('groom_education', e.target.value)}
                    placeholder="S1 Teknik Informatika"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groom_hobbies">Hobi</Label>
                <Input
                  id="groom_hobbies"
                  value={formData.groom_hobbies || ''}
                  onChange={(e) => handleInputChange('groom_hobbies', e.target.value)}
                  placeholder="Fotografi & Traveling"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groom_description">Deskripsi</Label>
                <Textarea
                  id="groom_description"
                  value={formData.groom_description || ''}
                  onChange={(e) => handleInputChange('groom_description', e.target.value)}
                  placeholder="Deskripsi singkat tentang mempelai pria"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groom_image_url">URL Foto</Label>
                <Input
                  id="groom_image_url"
                  value={formData.groom_image_url || ''}
                  onChange={(e) => handleInputChange('groom_image_url', e.target.value)}
                  placeholder="https://example.com/groom-photo.jpg"
                />
                {formData.groom_image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.groom_image_url} 
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-full border-2 border-primary/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bride" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartIcon className="h-5 w-5" />
                Informasi Mempelai Wanita
              </CardTitle>
              <CardDescription>
                Kelola informasi dan profil mempelai wanita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bride_name">Nama Panggilan</Label>
                  <Input
                    id="bride_name"
                    value={formData.bride_name || ''}
                    onChange={(e) => handleInputChange('bride_name', e.target.value)}
                    placeholder="Sari"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bride_full_name">Nama Lengkap</Label>
                  <Input
                    id="bride_full_name"
                    value={formData.bride_full_name || ''}
                    onChange={(e) => handleInputChange('bride_full_name', e.target.value)}
                    placeholder="Sari Indah"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bride_parents">Nama Orang Tua</Label>
                <Input
                  id="bride_parents"
                  value={formData.bride_parents || ''}
                  onChange={(e) => handleInputChange('bride_parents', e.target.value)}
                  placeholder="Bapak Ahmad Wijaya & Ibu Rahayu"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bride_profession">Profesi</Label>
                  <Input
                    id="bride_profession"
                    value={formData.bride_profession || ''}
                    onChange={(e) => handleInputChange('bride_profession', e.target.value)}
                    placeholder="Dokter Umum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bride_education">Pendidikan</Label>
                  <Input
                    id="bride_education"
                    value={formData.bride_education || ''}
                    onChange={(e) => handleInputChange('bride_education', e.target.value)}
                    placeholder="S1 Kedokteran"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bride_hobbies">Hobi</Label>
                <Input
                  id="bride_hobbies"
                  value={formData.bride_hobbies || ''}
                  onChange={(e) => handleInputChange('bride_hobbies', e.target.value)}
                  placeholder="Memasak & Berkebun"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bride_description">Deskripsi</Label>
                <Textarea
                  id="bride_description"
                  value={formData.bride_description || ''}
                  onChange={(e) => handleInputChange('bride_description', e.target.value)}
                  placeholder="Deskripsi singkat tentang mempelai wanita"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bride_image_url">URL Foto</Label>
                <Input
                  id="bride_image_url"
                  value={formData.bride_image_url || ''}
                  onChange={(e) => handleInputChange('bride_image_url', e.target.value)}
                  placeholder="https://example.com/bride-photo.jpg"
                />
                {formData.bride_image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.bride_image_url} 
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-full border-2 border-rose-gold/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoupleManagement;