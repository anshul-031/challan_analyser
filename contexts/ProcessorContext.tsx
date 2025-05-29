"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChallanData {
  [key: string]: {
    Pending_data: any[];
    Disposed_data: any[];
  };
}

interface ProcessorContextType {
  registrationNumbers: string[];
  setRegistrationNumbers: (numbers: string[]) => void;
  resetRegistrationNumbers: () => void;
  processing: boolean;
  processedCount: number;
  startProcessing: () => void;
  challanData: ChallanData;
  challansFound: number;
  errors: { regNum: string; message: string }[];
  currentBatchNumbers: string[];
}

const ProcessorContext = createContext<ProcessorContextType | undefined>(undefined);

export function ProcessorProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [registrationNumbers, setRegistrationNumbers] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [challanData, setChallanData] = useState<ChallanData>({});
  const [errors, setErrors] = useState<{ regNum: string; message: string }[]>([]);
  const [currentBatchNumbers, setCurrentBatchNumbers] = useState<string[]>([]);

  // Calculate total number of challans found
  const challansFound = Object.values(challanData).reduce((total, data) => {
    const pendingCount = data.Pending_data?.length || 0;
    const disposedCount = data.Disposed_data?.length || 0;
    return total + pendingCount + disposedCount;
  }, 0);

  const resetRegistrationNumbers = useCallback(() => {
    if (processing) return;
    
    setRegistrationNumbers([]);
    setProcessedCount(0);
    setChallanData({});
    setErrors([]);
    setCurrentBatchNumbers([]);
  }, [processing]);

  const fetchChallanData = useCallback(async (regNum: string) => {
    try {
      // Using our own API route as a proxy to avoid CORS issues
      const response = await fetch(`/api/challan?regNum=${encodeURIComponent(regNum)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error === "true" || !data.response || !data.response[0] || data.response[0].responseStatus !== "SUCCESS") {
        throw new Error("Failed to fetch challan data");
      }
      
      const responseData = data.response[0].response.data;
      return {
        Pending_data: responseData.Pending_data || [],
        Disposed_data: responseData.Disposed_data || []
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }, []);

  const processBatch = useCallback(async (batch: string[]) => {
    setCurrentBatchNumbers(batch);
    
    const batchPromises = batch.map(async (regNum) => {
      try {
        const data = await fetchChallanData(regNum);
        
        setChallanData(prev => ({
          ...prev,
          [regNum]: data
        }));
        
        return { success: true, regNum };
      } catch (error) {
        setErrors(prev => [...prev, { 
          regNum, 
          message: error instanceof Error ? error.message : "Unknown error" 
        }]);
        return { success: false, regNum };
      }
    });
    
    await Promise.all(batchPromises);
    setProcessedCount(prev => prev + batch.length);
    setCurrentBatchNumbers([]);
  }, [fetchChallanData]);

  const startProcessing = useCallback(async () => {
    if (processing || registrationNumbers.length === 0) return;
    
    setProcessing(true);
    setProcessedCount(0);
    setChallanData({});
    setErrors([]);
    
    try {
      // Process in batches of 5
      const batchSize = 2;
      for (let i = 0; i < registrationNumbers.length; i += batchSize) {
        const batch = registrationNumbers.slice(i, i + batchSize);
        await processBatch(batch);
      }
      
      toast({
        title: "Processing complete",
        description: `Processed ${registrationNumbers.length} registration numbers with ${errors.length} errors`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setProcessing(false);
    }
  }, [processing, registrationNumbers, processBatch, toast]);

  return (
    <ProcessorContext.Provider
      value={{
        registrationNumbers,
        setRegistrationNumbers,
        resetRegistrationNumbers,
        processing,
        processedCount,
        startProcessing,
        challanData,
        challansFound,
        errors,
        currentBatchNumbers,
      }}
    >
      {children}
    </ProcessorContext.Provider>
  );
}

export function useProcessor() {
  const context = useContext(ProcessorContext);
  if (context === undefined) {
    throw new Error('useProcessor must be used within a ProcessorProvider');
  }
  return context;
}