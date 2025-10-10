import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | NBA Fantasy Draft Assistant',
    default: 'NBA Fantasy Draft Assistant',
  },
  description: 'Your AI-powered NBA fantasy basketball assistant',
}

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to NBA Fantasy Draft Assistant</h1>
      <p className="text-muted-foreground text-center max-w-2xl mb-8">
        Get expert advice on your fantasy basketball draft with AI-powered insights. 
        Click the chat icon in the header to start asking questions!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Player Analysis</h2>
          <p className="text-muted-foreground">
            Get detailed stats and insights on any NBA player to help you make informed draft decisions.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Draft Strategy</h2>
          <p className="text-muted-foreground">
            Receive personalized advice on draft strategy, sleepers, and value picks.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Real-time News</h2>
          <p className="text-muted-foreground">
            Stay updated with the latest NBA news and how it impacts fantasy value.
          </p>
        </div>
        <div className="p-6 border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Statistical Insights</h2>
          <p className="text-muted-foreground">
            Access comprehensive NBA statistics to identify trends and opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}