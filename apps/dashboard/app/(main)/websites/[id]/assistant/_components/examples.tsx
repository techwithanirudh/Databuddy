import { Button } from '@/components/ui/button';
import { TrendUpIcon, HashIcon, ChartBarIcon, SparkleIcon, LightningIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const examples = [
    {
        text: 'Show me page views over the last 7 days',
        icon: TrendUpIcon,
        type: 'chart',
    },
    { text: 'How many visitors yesterday?', icon: HashIcon, type: 'metric' },
    {
        text: 'Top traffic sources breakdown',
        icon: ChartBarIcon,
        type: 'chart',
    },
    { text: "What's my bounce rate?", icon: HashIcon, type: 'metric' },
];

export function Examples({ sendMessage, isLoading, isRateLimited }: { sendMessage: (text: string) => void, isLoading: boolean, isRateLimited: boolean }) {
    return (
        <div className="fade-in-0 slide-in-from-bottom-4 h-full animate-in space-y-6 duration-500">
            <div className="flex h-full flex-col justify-between">
                <div className="space-y-2 py-4 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                        <SparkleIcon
                            className="h-8 w-8 text-primary"
                            weight="duotone"
                        />
                    </div>
                    <h3 className="font-semibold text-lg">
                        Welcome to Databunny
                    </h3>
                    <p className="mx-auto max-w-md text-muted-foreground text-sm">
                        I'm Databunny, your data analyst. I can help you understand
                        your website data through charts, metrics, and insights.
                        Just ask me anything!
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <LightningIcon className="h-4 w-4" weight="duotone" />
                        <span>Try these examples:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        {examples.map((question, index) => (
                            <Button
                                className={cn(
                                    'h-auto px-4 py-3 text-left font-normal text-sm',
                                    'hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5',
                                    'border-dashed transition-all duration-300 hover:border-solid',
                                    'fade-in-0 slide-in-from-left-2 animate-in'
                                )}
                                key={question.text}
                                onClick={() => {
                                    sendMessage(question.text);
                                }}
                                disabled={isLoading || isRateLimited}
                                size="sm"
                                style={{ animationDelay: `${index * 100}ms` }}
                                variant="outline"
                            >
                                <question.icon className="mr-3 h-4 w-4 flex-shrink-0 text-primary/70" />
                                <div className="flex-1">
                                    <div className="font-medium">{question.text}</div>
                                    <div className="text-muted-foreground text-xs capitalize">
                                        {question.type} response
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}