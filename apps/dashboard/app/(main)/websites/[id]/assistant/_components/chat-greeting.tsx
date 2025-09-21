import { SparkleIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export const ChatGreeting = () => {
    return (
        <div
            key="overview"
            className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center items-center px-4 md:mt-16 md:px-8"
        >
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.5 }}
                className="size-16 mb-4 rounded-full inline-flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10"
            >
                <SparkleIcon
                    className="h-8 w-8 text-primary"
                    weight="duotone"
                />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.5 }}
                className="font-semibold text-lg"
            >
                Welcome to Databunny
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.6 }}
                className="text-muted-foreground text-sm max-w-md"
            >
                I'm Databunny, your data analyst. I can help you understand
                your website data through charts, metrics, and insights.
                Just ask me anything!
            </motion.div>
        </div>
    );
};