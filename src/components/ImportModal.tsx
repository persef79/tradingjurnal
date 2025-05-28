import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { parseMT5Data } from '../utils/mt5Parser';
import { JournalData } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: JournalData) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  const handleImport = async () => {
    if (!file || !auth.currentUser) {
      setError('Please select a file to import and ensure you are logged in');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const csvData = await readFileContent(file);
      const journalData = parseMT5Data(csvData);
      
      if (Object.keys(journalData.days).length === 0) {
        throw new Error('No valid trade data found in the file');
      }

      // Save to Firestore
      const docRef = doc(db, 'trading_data', auth.currentUser.uid);
      await setDoc(docRef, {
        data: journalData,
        updatedAt: new Date().toISOString()
      });
      
      onImport(journalData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse the file');
    } finally {
      setIsLoading(false);
    }
  };
  
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Import MT5 Trading Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' 
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              {file ? (
                <>
                  <div className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Drop your MT5 CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV file exported from MetaTrader 5
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isLoading}
              className={`px-4 py-2 rounded-md text-white transition-colors
                         ${!file || isLoading
                           ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                           : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                         }`}
            >
              {isLoading ? 'Processing...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;