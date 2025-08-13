import { Button } from '@/components/ui/button';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useWeddingContent } from '@/hooks/useWeddingContent';

export const LoveStorySection = () => {
  const { loveStory, isLoading, error } = useWeddingContent();

  if (isLoading) {
    return (
      <div className="elegant-card bg-card/90 backdrop-blur-md rounded-3xl p-12 md:p-16 max-w-5xl mx-auto border border-primary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat kisah cinta...</p>
        </div>
      </div>
    );
  }

  if (error || !loveStory) {
    return (
      <div className="elegant-card bg-card/90 backdrop-blur-md rounded-3xl p-12 md:p-16 max-w-5xl mx-auto border border-primary/10">
        <div className="text-center">
          <HeartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {error || 'Kisah cinta tidak ditemukan'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="elegant-card bg-card/90 backdrop-blur-md rounded-3xl p-12 md:p-16 max-w-5xl mx-auto border border-primary/10 hover:border-primary/20 transition-all duration-500 group">
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <HeartIcon className="h-12 w-12 text-rose-gold mx-auto mb-6 floating" />
          <div className="absolute inset-0 h-12 w-12 mx-auto animate-ping opacity-30">
            <HeartIcon className="h-12 w-12 text-rose-gold" />
          </div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-gradient mb-6">
          {loveStory.title}
        </h3>
        {loveStory.subtitle && (
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {loveStory.subtitle}
          </p>
        )}
      </div>
      
      {/* Timeline */}
      {loveStory.timeline_items && loveStory.timeline_items.length > 0 && (
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {loveStory.timeline_items.map((item, index) => {
            const colors = ['bg-primary/10 text-primary', 'bg-rose-gold/10 text-rose-gold', 'bg-accent/20 text-foreground'];
            const colorClass = colors[index % colors.length];
            
            return (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-30 transition-colors`}>
                  <span className="text-2xl font-bold">{item.year}</span>
                </div>
                <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      {loveStory.description && (
        <p className="text-lg text-muted-foreground leading-relaxed mb-8 text-center max-w-3xl mx-auto">
          {loveStory.description}
        </p>
      )}
      
      <div className="text-center">
        <Button variant="gold" size="lg" className="smoke-effect group-hover:shadow-glow">
          <HeartIcon className="h-5 w-5 mr-2" />
          Baca Cerita Lengkap
        </Button>
      </div>
    </div>
  );
};