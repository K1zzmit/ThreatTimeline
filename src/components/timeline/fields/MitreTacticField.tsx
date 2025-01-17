import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MITRE_TACTICS_AND_TECHNIQUES } from "@/lib/mitre";
import { TimelineEvent } from "@/pages/Index";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MitreTacticFieldProps {
  event: TimelineEvent;
  onEventChange: (event: TimelineEvent) => void;
  onLateralMovement?: (sourceEvent: TimelineEvent, destinationHost: string) => void;
}

export const MitreTacticField: React.FC<MitreTacticFieldProps> = ({ 
  event, 
  onEventChange,
  onLateralMovement 
}) => {
  const [showLateralDialog, setShowLateralDialog] = useState(false);
  const [sourceHostname, setSourceHostname] = useState("");
  const [sourceIP, setSourceIP] = useState("");
  const [destinationHostname, setDestinationHostname] = useState("");
  const [destinationIP, setDestinationIP] = useState("");

  const handleTacticChange = (value: string) => {
    if (value === "Lateral Movement") {
      setShowLateralDialog(true);
      // Try to pre-fill source fields from event
      const artifacts = event.artifacts || [];
      const sourceHostArtifact = artifacts.find(a => a.type === 'hostname' && a.name === 'Source Host');
      const destHostArtifact = artifacts.find(a => a.type === 'hostname' && a.name === 'Destination Host');
      
      setSourceHostname(sourceHostArtifact?.value || event.host || "");
      setSourceIP(sourceHostArtifact?.linkedValue || "");
      setDestinationHostname(destHostArtifact?.value || "");
      setDestinationIP(destHostArtifact?.linkedValue || "");

      // Update the event with the tactic
      onEventChange({ 
        ...event, 
        tactic: value,
        technique: undefined
      });
    } else {
      onEventChange({ 
        ...event, 
        tactic: value,
        technique: undefined 
      });
    }
  };

  const handleLateralMovementConfirm = () => {
    if ((sourceHostname || sourceIP) && (destinationHostname || destinationIP) && onLateralMovement) {
      // Create source and destination artifacts
      const sourceArtifact = {
        type: 'hostname' as const,
        name: 'Source Host',
        value: sourceHostname || sourceIP || '',
        linkedValue: sourceIP && sourceHostname ? sourceIP : undefined
      };

      const destinationArtifact = {
        type: 'hostname' as const,
        name: 'Destination Host',
        value: destinationHostname || destinationIP || '',
        linkedValue: destinationIP && destinationHostname ? destinationIP : undefined
      };

      // Update the event with both source and destination information
      const updatedEvent = {
        ...event,
        title: `Lateral Movement to ${destinationHostname || destinationIP}`,
        host: sourceHostname || undefined,
        artifacts: [
          ...(event.artifacts || []).filter(a => !['Source Host', 'Destination Host'].includes(a.name)),
          sourceArtifact,
          destinationArtifact
        ]
      };

      // Create destination string with hostname and IP if available
      const destinationValue = destinationHostname 
        ? destinationIP 
          ? `${destinationHostname} (${destinationIP})`
          : destinationHostname
        : destinationIP;
      
      // First update the current event
      onEventChange(updatedEvent);
      
      // Then trigger lateral movement
      onLateralMovement(updatedEvent, destinationValue);
      setShowLateralDialog(false);
      setSourceHostname("");
      setSourceIP("");
      setDestinationHostname("");
      setDestinationIP("");
    }
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="tactic">MITRE Tactic</Label>
        <Select
          value={event.tactic || ''}
          onValueChange={handleTacticChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tactic" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(MITRE_TACTICS_AND_TECHNIQUES).map((tactic) => (
              <SelectItem key={tactic} value={tactic}>
                {tactic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label htmlFor="technique">MITRE Technique</Label>
        <Select
          value={event.technique || ''}
          onValueChange={(value) => onEventChange({ ...event, technique: value })}
          disabled={!event.tactic}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select technique" />
          </SelectTrigger>
          <SelectContent>
            {event.tactic && MITRE_TACTICS_AND_TECHNIQUES[event.tactic]?.map((technique) => (
              <SelectItem key={technique} value={technique}>
                {technique}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={showLateralDialog} onOpenChange={setShowLateralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Lateral Movement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <Label className="text-base">Source Host</Label>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sourceHostname">Hostname</Label>
                  <Input
                    id="sourceHostname"
                    value={sourceHostname}
                    onChange={(e) => setSourceHostname(e.target.value)}
                    placeholder="Enter source hostname"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sourceIP">IP Address</Label>
                  <Input
                    id="sourceIP"
                    value={sourceIP}
                    onChange={(e) => setSourceIP(e.target.value)}
                    placeholder="Enter source IP"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base">Destination Host</Label>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="destinationHostname">Hostname</Label>
                  <Input
                    id="destinationHostname"
                    value={destinationHostname}
                    onChange={(e) => setDestinationHostname(e.target.value)}
                    placeholder="Enter destination hostname"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destinationIP">IP Address</Label>
                  <Input
                    id="destinationIP"
                    value={destinationIP}
                    onChange={(e) => setDestinationIP(e.target.value)}
                    placeholder="Enter destination IP"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="default"
              onClick={handleLateralMovementConfirm}
              disabled={(!sourceHostname && !sourceIP) || (!destinationHostname && !destinationIP)}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};