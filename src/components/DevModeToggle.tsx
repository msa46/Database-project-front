import React from 'react';
import { devModeManager } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DevModeToggleProps {
  className?: string;
}

export function DevModeToggle({ className }: DevModeToggleProps) {
  // Clear any existing dev mode on component mount to ensure Secure mode is default
  React.useEffect(() => {
    if (window.localStorage.getItem('force_dev_mode') === 'true') {
      window.localStorage.removeItem('force_dev_mode');
      console.log('[DEVMODE] Cleared existing dev mode - defaulting to Secure mode');
      // Update state to reflect the change
      setModeInfo({ mode: 'production', reason: 'default secure mode', canOverride: true });
      setIsDevMode(false);
    }
  }, []);

  const [modeInfo, setModeInfo] = React.useState(() => {
    // Ensure we start with Secure mode
    if (window.localStorage.getItem('force_dev_mode') === 'true') {
      return { mode: 'development', reason: 'forced via localStorage', canOverride: true };
    }
    return { mode: 'production', reason: 'default secure mode', canOverride: true };
  });

  const [isDevMode, setIsDevMode] = React.useState(() => {
    // Ensure we start with Secure mode (not Development mode)
    return window.localStorage.getItem('force_dev_mode') === 'true';
  });

  const handleToggle = () => {
    const newState = !isDevMode; // Simply alternate the current state
    devModeManager.setDevMode(newState);

    setIsDevMode(newState);
    setModeInfo(devModeManager.getModeInfo());

    // Dispatch custom event to notify other components of dev mode change
    window.dispatchEvent(new CustomEvent('devModeToggle'));
    console.log('[DEVMODE] Dispatched devModeToggle event');
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