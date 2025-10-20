import React from 'react';
import { devModeManager } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DevModeToggleProps {
  className?: string;
}

export function DevModeToggle({ className }: DevModeToggleProps) {
  const [modeInfo, setModeInfo] = React.useState(devModeManager.getModeInfo());
  const [isDevMode, setIsDevMode] = React.useState(devModeManager.isDevModeActive());

  const handleToggle = () => {
    const newState = !isDevMode; // Simply alternate the current state
    devModeManager.setDevMode(newState);

    setIsDevMode(newState);
    setModeInfo(devModeManager.getModeInfo());
  };

  const getModeColor = () => {
    return isDevMode ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-green-100 border-green-300 text-green-800';
  };

  const getModeIcon = () => {
    return isDevMode ? '🚧' : '🔒';
  };

  return (
    <Card className={`${getModeColor()} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getModeIcon()} Development Mode
        </CardTitle>
        <CardDescription className="text-xs">
          Current: {modeInfo.mode} ({modeInfo.reason})
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            {isDevMode ? (
              <div>
                <div>✅ Using unsecured endpoints</div>
                <div>👤 Fixed user: dev_user (ID: 1)</div>
                <div>🔓 No authentication required</div>
              </div>
            ) : (
              <div>
                <div>🔒 Using secure endpoints</div>
                <div>🔐 JWT token authentication</div>
                <div>👤 Real user authentication</div>
              </div>
            )}
          </div>

          <Button
            onClick={handleToggle}
            size="sm"
            variant={isDevMode ? "destructive" : "default"}
            className="w-full text-xs"
          >
            Switch to {isDevMode ? 'Secure' : 'Dev'} Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}