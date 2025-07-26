'use client';

import React, { useState, useEffect } from 'react';
import { getStorageType, setStorageType } from '@/lib/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const [storageType, setStorageTypeValue] = useState<string | null>(null);

  useEffect(() => {
    setStorageTypeValue(getStorageType());
  }, []);

  const handleStorageChange = (value: 'local' | 'db') => {
    setStorageTypeValue(value);
  };

  const handleSave = () => {
    if (storageType) {
      setStorageType(storageType as 'local' | 'db');
      // The page will be reloaded by setStorageType
    }
  };
  
  if (storageType === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Storage Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storage-adapter">Storage Adapter</Label>
              <Select
                value={storageType}
                onValueChange={handleStorageChange}
              >
                <SelectTrigger id="storage-adapter">
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Storage</SelectItem>
                  <SelectItem value="db">Database</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose where to store your chat history. Changing this setting will reload the application.
              </p>
            </div>
            <Button onClick={handleSave}>Save and Reload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}