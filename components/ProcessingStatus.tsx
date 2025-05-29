"use client";

import { useProcessor } from '@/contexts/ProcessorContext';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ProcessingStatus() {
  const { 
    processing, 
    processedCount, 
    registrationNumbers,
    challansFound,
    errors,
    currentBatchNumbers
  } = useProcessor();

  // Calculate progress percentage
  const progressPercentage = registrationNumbers.length > 0 
    ? Math.round((processedCount / registrationNumbers.length) * 100) 
    : 0;

  if (!processing && processedCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Processing will start when you click the Start button
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-2xl font-bold">{challansFound}</div>
          <div className="text-xs text-muted-foreground">Challans Found</div>
        </Card>
        
        <Card className="p-3">
          <div className="text-2xl font-bold">{errors.length}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </Card>
      </div>
      
      {processing && currentBatchNumbers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Currently Processing:</p>
          <div className="flex flex-wrap gap-2">
            {currentBatchNumbers.map((regNum, idx) => (
              <Badge key={idx} variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {regNum}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Errors:</p>
          <ScrollArea className="h-[80px] rounded-md border">
            <div className="p-2 space-y-1">
              {errors.map((error, idx) => (
                <div key={idx} className="flex text-xs text-destructive items-start gap-2 p-1">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error.regNum}: {error.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {!processing && processedCount > 0 && (
        <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Processing complete
        </div>
      )}
    </div>
  );
}