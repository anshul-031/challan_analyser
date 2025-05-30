"use client";

import { useProcessor } from '@/contexts/ProcessorContext';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProcessingStatus() {
  const { 
    processing, 
    processedCount, 
    registrationNumbers,
    challansFound,
    errors,
    currentBatchNumbers,
    retryFailedChallans,
    retrySpecificChallan,
    isRetrying,
    batchSize,
    setBatchSize
  } = useProcessor();

  // Calculate progress percentage
  const progressPercentage = registrationNumbers.length > 0 
    ? Math.round((processedCount / registrationNumbers.length) * 100) 
    : 0;

  if (!processing && processedCount === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Label htmlFor="batch-size-input">Batch Size:</Label>
          <Input
            id="batch-size-input"
            type="number"
            min={1}
            max={100}
            value={batchSize}
            onChange={e => setBatchSize(Number(e.target.value))}
            className="w-20"
            disabled={processing}
          />
        </div>
        <p className="text-muted-foreground">
          Processing will start when you click the Start button
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start items-center gap-2 mb-2">
        <Label htmlFor="batch-size-input">Batch Size:</Label>
        <Input
          id="batch-size-input"
          type="number"
          min={1}
          max={100}
          value={batchSize}
          onChange={e => setBatchSize(Number(e.target.value))}
          className="w-20"
          disabled={processing}
        />
      </div>
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
      
      {(processing || isRetrying) && currentBatchNumbers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isRetrying ? 'Retrying Failed Vehicles:' : 'Currently Processing:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentBatchNumbers.map((regNum, idx) => (
              <Badge 
                key={idx} 
                variant={isRetrying ? "destructive" : "secondary"} 
                className="animate-pulse"
              >
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {regNum}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Errors:</p>
            {!processing && !isRetrying && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryFailedChallans}
                disabled={isRetrying}
                className="gap-2"
                title="Retry all failed vehicles at once"
              >
                <RotateCcw className="h-3 w-3" />
                Retry All ({errors.length})
              </Button>
            )}
          </div>
          <ScrollArea className="h-[120px] rounded-md border">
            <div className="p-2 space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 text-xs bg-destructive/5 rounded border">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-destructive" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-destructive">{error.regNum}</div>
                    <div className="text-muted-foreground truncate">{error.message}</div>
                  </div>
                  {!processing && !isRetrying && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retrySpecificChallan(error.regNum)}
                      className="h-6 px-2 text-xs hover:bg-orange-100"
                      title={`Retry ${error.regNum}`}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {!processing && !isRetrying && processedCount > 0 && (
        <div className="flex items-center justify-center p-2 text-sm text-primary bg-primary/10 rounded-md">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Processing complete
        </div>
      )}
      
      {isRetrying && (
        <div className="flex items-center justify-center p-2 text-sm text-orange-600 bg-orange-50 rounded-md">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Retrying failed vehicles...
        </div>
      )}
    </div>
  );
}