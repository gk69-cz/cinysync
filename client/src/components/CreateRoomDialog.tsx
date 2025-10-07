// client/src/components/CreateRoomDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Check, Upload, Film, X, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createRoom } from "@/services/roomService";
import { VideoUploadService } from "@/services/videoUploadService";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function CreateRoomDialog() {
  const [roomName, setRoomName] = useState("");
  const [service, setService] = useState("");
  const [url, setUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [roomLink, setRoomLink] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Video upload states
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video must be less than 500MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadVideo = async (): Promise<string> => {
    if (!selectedFile) throw new Error("No file selected");

    setIsUploading(true);
    setUploadProgress(0);

    try {
     const downloadUrl = await VideoUploadService.uploadVideo(selectedFile, {
    onProgress: (progress) => {
      console.log(`${progress.progress.toFixed(1)}%`);
    },
    maxRetries: 3,
    retryDelay: 2000
  });
  console.log('Video URL:', downloadUrl);

      toast({
        title: "Upload complete!",
        description: "Your video is ready",
      });

      return downloadUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!roomName.trim() || !service) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if URL or file is provided
    if (uploadMode === 'url' && !url.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a video URL",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === 'upload' && !selectedFile) {
      toast({
        title: "Missing file",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "Please log in to create a room",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Upload video if in upload mode
      let videoUrl = url.trim();
      if (uploadMode === 'upload') {
        videoUrl = await handleUploadVideo();
      }

      const { roomId, roomCode: code } = await createRoom({
        roomName: roomName.trim(),
        service: service as 'netflix' | 'prime' | 'disney',
        url: videoUrl,
        isPrivate,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || "Anonymous",
        maxParticipants: 10,
        roomCode: roomCode
      });

      const link = `${window.location.origin}/room/${roomId}`;
      setRoomLink(link);
      setRoomCode(code);
      setShowSuccess(true);

      toast({
        title: "Room created!",
        description: "Your watch party is ready",
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share it with your friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast({
        title: "Code copied!",
        description: "Share it with your friends",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = () => {
    setLocation(roomLink.replace(window.location.origin, ""));
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRoomName("");
    setService("");
    setUrl("");
    setIsPrivate(false);
    setShowSuccess(false);
    setRoomLink("");
    setRoomCode("");
    setCopied(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadMode('url');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-2xl" data-testid="button-create-room">
          <Plus className="mr-2 h-5 w-5" />
          Create Watch Party
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {showSuccess ? "Room Created!" : "Create a Watch Party"}
          </DialogTitle>
        </DialogHeader>
        
        {!showSuccess ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name *</Label>
              <Input
                id="room-name"
                placeholder="Friday Night Movie"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="input-room-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service">Streaming Service *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="select-service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netflix">Netflix</SelectItem>
                  <SelectItem value="prime">Prime Video</SelectItem>
                  <SelectItem value="disney">Disney+</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="direct">Direct Video URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Video Source *</Label>
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'url' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="mt-4">
                  <div className="space-y-2">
                    <Input
                      id="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-12 rounded-xl"
                      data-testid="input-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a YouTube, Netflix, or direct video URL
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  {!selectedFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-primary/5 hover:bg-primary/10">
                      <Upload className="w-8 h-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to upload video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, WebM, MOV (max 500MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-3">
                          <Film className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={removeSelectedFile}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Uploading...</span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Private Room</Label>
                <p className="text-sm text-muted-foreground">Only invited friends can join</p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                data-testid="switch-private"
              />
            </div>
            
            <Button 
              onClick={handleCreate} 
              className="w-full h-12 rounded-2xl" 
              disabled={isCreating || isUploading}
              data-testid="button-submit-create-room"
            >
              {isCreating ? "Creating..." : isUploading ? "Uploading..." : "Create Room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Room Code</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-background px-4 py-3 rounded-lg font-mono text-lg">
                    {roomCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="h-12 w-12"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Room Link</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={roomLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="h-10 w-10"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleJoinRoom}
                className="flex-1 h-12 rounded-2xl"
              >
                Join Room Now
              </Button>
              <Button
                onClick={() => handleOpenChange(false)}
                variant="outline"
                className="flex-1 h-12 rounded-2xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}