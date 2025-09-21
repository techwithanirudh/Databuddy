import { type BaseContext, createTypedContext } from "@ai-sdk-tools/artifacts";
import { User } from "@databuddy/auth";

interface ChatContext extends BaseContext {
    user: User;
}

const { setContext, getContext } = createTypedContext<ChatContext>();

export function getCurrentUser() {
    const context = getContext();
    return {
        user: context.user,
    };
}

export { setContext, getContext };