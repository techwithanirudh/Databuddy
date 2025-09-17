import { type BaseContext, createTypedContext } from "@ai-sdk-tools/artifacts";

interface ChatContext extends BaseContext {
    userId: string;
    fullName: string;
}

const { setContext, getContext } = createTypedContext<ChatContext>();

export function getCurrentUser() {
    const context = getContext();
    return {
        id: context.userId,
        fullName: context.fullName,
    };
}

export { setContext, getContext };