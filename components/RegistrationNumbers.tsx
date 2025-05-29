"use client";

import { useProcessor } from '@/contexts/ProcessorContext';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export function RegistrationNumbers() {
  const { toast } = useToast();
  const { 
    registrationNumbers, 
    startProcessing, 
    processing, 
    resetRegistrationNumbers,
    processedCount,
    isRetrying
  } = useProcessor();

  const handleStartProcessing = () => {
    if (registrationNumbers.length === 0) {
      toast({
        variant: "destructive",
        title: "No registration numbers",
        description: "Please upload a file with valid registration numbers first",
      });
      return;
    }
    
    startProcessing();
  };

  if (!registrationNumbers || registrationNumbers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No registration numbers yet. Upload an Excel file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium">
            {registrationNumbers.length} unique {registrationNumbers.length === 1 ? 'number' : 'numbers'}
          </p>
          {processedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {processedCount} of {registrationNumbers.length} processed
            </p>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetRegistrationNumbers}
            disabled={processing}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleStartProcessing}
            disabled={processing || registrationNumbers.length === 0}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Start
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[200px] rounded-md border">
        <div className="p-4">
          {registrationNumbers.map((regNum, index) => (
            <div 
              key={index} 
              className={`px-3 py-1.5 text-sm rounded-md mb-1.5 ${
                processing && index < processedCount 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-card hover:bg-secondary/50'
              }`}
            >
              {regNum}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}