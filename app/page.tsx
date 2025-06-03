import Workspace from "./(routes)/workspace/[fileId]/page";

// Hardcode a fileId for demo workspace (replace with a real fileId if needed)
const DEMO_FILE_ID = "demo-file-id";

export default function Home() {
  // Render the Workspace directly as the home page
  return (
    <div className="w-full h-full">
      <Workspace params={{ fileId: DEMO_FILE_ID }} />
    </div>
  );
}
