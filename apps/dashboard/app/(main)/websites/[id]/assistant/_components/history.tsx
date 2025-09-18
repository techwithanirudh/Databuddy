export function ChatHistory() {
    const { data: websites, isLoading: isLoadingWebsites } =
        trpc.websites.list.useQuery({
            organizationId: organization.id,
        });

    return (
        <div>
            <h1>Chat History</h1>
        </div>
    );
}