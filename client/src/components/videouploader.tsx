import { useState } from 'react';
import { Upload, Film, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function VideoUploadHelper() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      // Check size (max 100MB for demo)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('Video must be less than 100MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const uploadToFirebase = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Simulated upload - replace with actual Firebase Storage code
      // const storage = getStorage();
      // const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      // const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        // In real implementation, get the download URL:
        // const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const mockUrl = `https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/videos%2F${file.name}?alt=media`;
        setVideoUrl(mockUrl);
        setUploading(false);
      }, 3500);

    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(videoUrl);
  };

  const reset = () => {
    setFile(null);
    setVideoUrl('');
    setProgress(0);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Film className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Video Upload Guide</h1>
          <p className="text-gray-300">Get direct video URLs for perfect sync</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {!videoUrl ? (
            <>
              {/* Upload Area */}
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-purple-400/50 rounded-xl cursor-pointer hover:border-purple-400 transition-colors bg-purple-500/10 hover:bg-purple-500/20">
                  <Upload className="w-12 h-12 text-purple-400 mb-4" />
                  <p className="text-lg text-white font-medium mb-2">Click to upload video</p>
                  <p className="text-sm text-gray-400">MP4, WebM, MOV (max 100MB)</p>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Film className="w-10 h-10 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Upload Button */}
                  {!uploading && (
                    <button
                      onClick={uploadToFirebase}
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Upload to Firebase Storage
                    </button>
                  )}

                  {/* Progress Bar */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 text-green-400">
                <CheckCircle className="w-12 h-12" />
                <p className="text-xl font-semibold">Upload Complete!</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Direct Video URL:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors border border-white/20"
              >
                Upload Another Video
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-white">📋 Implementation Guide</h2>
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">1. Install Firebase Storage</h3>
            <code className="block bg-black/50 p-3 rounded text-green-400 text-sm font-mono">
              npm install firebase
            </code>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">2. Add Upload Function</h3>
            <pre className="bg-black/50 p-4 rounded text-gray-300 text-xs font-mono overflow-x-auto">
{`import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

async function uploadVideo(file: File) {
  const storage = getStorage();
  const storageRef = ref(storage, \`videos/\${Date.now()}_\${file.name}\`);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}`}
            </pre>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">3. Use in Your App</h3>
            <pre className="bg-black/50 p-4 rounded text-gray-300 text-xs font-mono overflow-x-auto">
{`// When creating a room
const videoUrl = await uploadVideo(selectedFile);
await createRoom({
  roomName: 'My Watch Party',
  url: videoUrl, // ← Direct URL works perfectly!
  service: 'direct',
  ...
});`}
            </pre>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-3">✨ Alternative Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Cloudinary:</strong> Free 25GB, excellent CDN
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Bunny.net:</strong> $0.01/GB, very fast
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <div>
                  <strong className="text-white">AWS S3:</strong> Pay as you go, enterprise-grade
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}