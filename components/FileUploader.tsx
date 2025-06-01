"use client";

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast-simple';
import { useProcessor } from '@/contexts/ProcessorContext';
import { Progress } from '@/components/ui/progress';

export function FileUploader() {
  const { toast } = useToast();
  const { setRegistrationNumbers, processing } = useProcessor();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileState = useCallback(() => {
    setFileName(null);
    setUploadProgress(0);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(() => {
    if (processing || isProcessing) return;
    fileInputRef.current?.click();
  }, [processing, isProcessing]);

  const processFile = async (file: File) => {
    if (!file || isProcessing) return;
    
    setIsProcessing(true);
    setUploadProgress(10);
    setFileName(file.name);

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx or .xls)",
      });
      resetFileState();
      return;
    }

    try {
      setUploadProgress(30);
      const data = await readExcelFile(file);
      setUploadProgress(60);

      // Validate data structure
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Excel file appears to be empty or invalid");
      }

      // More flexible column detection
      const firstRow = data[0];
      const headers = Object.keys(firstRow);
      
      const registrationColumn = headers.find(header => 
        header.toLowerCase().includes('registration') || 
        header.toLowerCase().includes('reg') ||
        header.toLowerCase() === 'vehicle number' ||
        header.toLowerCase() === 'vehicle no'
      );

      if (!registrationColumn) {
        throw new Error("Could not find a registration number column. Please ensure your Excel file has a column with 'Registration Number' or similar header.");
      }

      setUploadProgress(80);

      // Extract registration numbers with better filtering
      const regNosFromExcel = data
        .map(row => {
          const value = row[registrationColumn];
          return value ? String(value).trim().toUpperCase() : null;
        })
        .filter(regNo => regNo && regNo.length > 0)
        .filter(regNo => {
          // Basic validation for Indian vehicle registration format
          const cleanRegNo = regNo.replace(/\s+/g, '');
          return cleanRegNo.length >= 6 && cleanRegNo.length <= 12;
        });

      // Remove duplicates
      const uniqueRegNos = Array.from(new Set(regNosFromExcel));

      if (uniqueRegNos.length === 0) {
        throw new Error("No valid registration numbers found in the file. Please check your data format.");
      }

      setUploadProgress(100);
      setRegistrationNumbers(uniqueRegNos);
      
      toast({
        title: "File processed successfully",
        description: `Found ${uniqueRegNos.length} unique registration numbers`,
      });
      
      // Keep progress at 100% for 2 seconds to show completion
      setTimeout(() => {
        setUploadProgress(0);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process the Excel file",
      });
      resetFileState();
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const fileData = e.target?.result;
          if (!fileData) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          const workbook = XLSX.read(fileData, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          if (!workbook.SheetNames.length) {
            reject(new Error("Excel file contains no sheets"));
            return;
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            reject(new Error("Failed to read Excel sheet"));
            return;
          }
          
          const json = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });
          
          if (!json.length) {
            reject(new Error("Excel sheet is empty"));
            return;
          }
          
          // Convert array of arrays to array of objects
          const headers = json[0] as string[];
          const rows = json.slice(1) as any[][];
          
          const parsedData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve(parsedData);
        } catch (error) {
          console.error('Excel reading error:', error);
          reject(new Error("Failed to parse Excel file. Please ensure it's a valid Excel file."));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
        isDragging 
          ? 'border-primary bg-primary/10 scale-105' 
          : 'border-border hover:border-primary/50 hover:bg-accent/50'
      } ${(processing || isProcessing) ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`rounded-full p-3 transition-colors ${
          uploadProgress === 100 
            ? 'bg-green-100 text-green-600' 
            : 'bg-primary/10 text-primary'
        }`}>
          {uploadProgress === 100 ? (
            <Check className="h-6 w-6" />
          ) : (
            <FileSpreadsheet className="h-6 w-6" />
          )}
        </div>
        
        <div className="space-y-2">
          {fileName ? (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {fileName}
              </p>
              {!isProcessing && uploadProgress !== 100 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFileState}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-foreground">
              Drag and drop your Excel file here
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            {uploadProgress === 100 
              ? 'File processed successfully!'
              : 'Supports .xlsx and .xls files'
            }
          </p>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full space-y-2">
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground">
              {isProcessing ? 'Processing...' : `${uploadProgress}%`}
            </p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="sr-only"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={processing || isProcessing}
          aria-label="Upload Excel file with vehicle registration numbers"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            disabled={processing || isProcessing}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {fileName ? 'Choose Different File' : 'Select File'}
          </Button>
          
          {fileName && uploadProgress !== 100 && !isProcessing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFileState}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}