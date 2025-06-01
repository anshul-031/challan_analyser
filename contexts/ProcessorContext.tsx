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
  retryFailedChallans: () => void;
  retrySpecificChallan: (regNum: string) => void;
  isRetrying: boolean;
  batchSize: number;
  setBatchSize: (size: number) => void;
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [batchSize, setBatchSize] = useState(2);

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
      
      const responseData = data.response[0].response;
      
      // Handle case where no records are found (code: "305")
      if (responseData.code === "305" || responseData.message === "No Records Found!") {
        return {
          Pending_data: [],
          Disposed_data: []
        };
      }
      
      // Handle normal case where data exists
      if (responseData.data) {
        return {
          Pending_data: responseData.data.Pending_data || [],
          Disposed_data: responseData.data.Disposed_data || []
        };
      }
      
      // Fallback for unexpected response structure
      return {
        Pending_data: [],
        Disposed_data: []
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
      // Process in batches using configurable batch size
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
  }, [processing, registrationNumbers, batchSize, processBatch, toast]);

  const retrySpecificChallan = useCallback(async (regNum: string) => {
    if (processing || isRetrying) return;
    
    setIsRetrying(true);
    
    // Remove the specific error for this registration number
    setErrors(prev => prev.filter(error => error.regNum !== regNum));
    
    try {
      await processBatch([regNum]);
      
      toast({
        title: "Retry successful",
        description: `Successfully retried ${regNum}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: `Failed to retry ${regNum}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsRetrying(false);
    }
  }, [processing, isRetrying, processBatch, toast]);

  const retryFailedChallans = useCallback(async () => {
    if (processing || isRetrying || errors.length === 0) return;
    
    setIsRetrying(true);
    const failedRegNums = errors.map(error => error.regNum);
    const initialErrorCount = errors.length;
    
    // Clear existing errors for the registration numbers we're retrying
    setErrors(prev => prev.filter(error => !failedRegNums.includes(error.regNum)));
    
    try {
      // Process failed registration numbers in batches using configurable batch size
      for (let i = 0; i < failedRegNums.length; i += batchSize) {
        const batch = failedRegNums.slice(i, i + batchSize);
        await processBatch(batch);
      }
      
      // Check how many errors remain after retry
      const remainingErrors = errors.filter(error => failedRegNums.includes(error.regNum)).length;
      const successfulRetries = initialErrorCount - remainingErrors;
      
      if (remainingErrors === 0) {
        toast({
          title: "Retry successful",
          description: `All ${failedRegNums.length} failed vehicles were successfully processed!`,
        });
      } else {
        toast({
          title: "Retry complete",
          description: `${successfulRetries} vehicles succeeded, ${remainingErrors} still failed. You can retry again if needed.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: error instanceof Error ? error.message : "Unknown error occurred during retry",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [processing, isRetrying, errors, batchSize, processBatch, toast]);

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
        retryFailedChallans,
        retrySpecificChallan,
        isRetrying,
        batchSize,
        setBatchSize,
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