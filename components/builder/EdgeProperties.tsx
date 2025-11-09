'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FlowEdge } from '@/types/mcp';
import { useMCPStore } from '@/store/mcpStore';
import { useToast } from '@/components/ui/use-toast';

interface EdgePropertiesProps {
  edge: FlowEdge;
}

export default function EdgeProperties({ edge }: EdgePropertiesProps) {
  const { updateEdge, getNodeById } = useMCPStore();
  const { toast } = useToast();
  
  const [label, setLabel] = useState(edge.data?.label || '');
  const [conditionType, setConditionType] = useState(edge.data?.condition?.type || 'always');
  const [expression, setExpression] = useState(edge.data?.condition?.expression || '');
  const [priority, setPriority] = useState(edge.data?.priority?.toString() || '0');
  const [description, setDescription] = useState(edge.data?.description || '');

  const sourceNode = getNodeById(edge.source);
  const targetNode = getNodeById(edge.target);

  const handleSave = () => {
    const updates: Partial<FlowEdge> = {
      data: {
        ...edge.data,
        label: label || undefined,
        condition: {
          type: conditionType,
          expression: conditionType === 'custom' ? expression : undefined,
        },
        priority: priority ? parseInt(priority) : 0,
        description: description || undefined,
      },
    };

    // Update edge styling based on condition
    if (conditionType === 'on-success') {
      updates.style = { 
        stroke: '#22c55e', 
        strokeWidth: 2,
        // Solid green line for success
      };
      updates.animated = true;
    } else if (conditionType === 'on-error') {
      updates.style = { 
        stroke: '#ef4444', 
        strokeWidth: 2,
        strokeDasharray: '5,5', // Dotted red line for error paths
      };
      updates.animated = false;
    } else if (conditionType === 'custom') {
      updates.style = { 
        stroke: '#f59e0b', 
        strokeWidth: 2,
        // Solid orange line for custom conditions
      };
      updates.animated = false;
    } else {
      updates.style = { 
        stroke: '#3b82f6', 
        strokeWidth: 2,
        // Solid blue line for always
      };
      updates.animated = false;
    }

    updateEdge(edge.id, updates);
    toast({ title: 'Saved', description: 'Connection properties updated' });
  };

  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'on-success': return '✅';
      case 'on-error': return '❌';
      case 'custom': return '⚙️';
      default: return '➡️';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔗 Connection Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Info */}
        <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source:</span>
            <Badge variant="outline">{sourceNode?.data.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Target:</span>
            <Badge variant="outline">{targetNode?.data.label}</Badge>
          </div>
        </div>

        <Separator />

        {/* Connection Label */}
        <div>
          <Label>Connection Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Success Path, Error Path"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional label displayed on the connection
          </p>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select value={conditionType} onValueChange={(v: any) => setConditionType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">
                <div className="flex items-center gap-2">
                  <span>➡️</span>
                  <div>
                    <p className="font-medium">Always</p>
                    <p className="text-xs text-muted-foreground">Connection is always taken</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="on-success">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <div>
                    <p className="font-medium">On Success</p>
                    <p className="text-xs text-muted-foreground">Only when status 200-299</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="on-error">
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  <div>
                    <p className="font-medium">On Error</p>
                    <p className="text-xs text-muted-foreground">Only when status 400+</p>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <span>⚙️</span>
                  <div>
                    <p className="font-medium">Custom Condition</p>
                    <p className="text-xs text-muted-foreground">JSONPath expression</p>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls when this connection is taken during execution
          </p>

          {conditionType === 'custom' && (
            <div className="mt-2">
              <Label className="text-xs">JSONPath Expression</Label>
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="$.status == 'success'"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expression evaluated against the node output
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Priority */}
        <div>
          <Label>Priority</Label>
          <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Lower numbers execute first when multiple connections exist (0 = highest priority)
          </p>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <Label>Description (Optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes about this connection..."
            rows={3}
          />
        </div>

        {/* Visual Preview */}
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-semibold mb-2">Visual Styling:</p>
          <div className="flex items-center gap-2">
            <span>{getConditionIcon(conditionType)}</span>
            <div className="flex-1 border-t-2" style={{
              borderColor: conditionType === 'on-success' ? '#22c55e' : 
                          conditionType === 'on-error' ? '#ef4444' :
                          conditionType === 'custom' ? '#f59e0b' : '#3b82f6',
            }}></div>
            {priority !== '0' && (
              <Badge variant="outline" className="text-xs">{priority}</Badge>
            )}
            {label && (
              <Badge className="text-xs">{label}</Badge>
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
