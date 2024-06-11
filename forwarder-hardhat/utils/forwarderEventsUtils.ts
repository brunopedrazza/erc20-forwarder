
export async function extractClonedForwarderAddress(transaction: any) {
    const cloneReceipt = await transaction.wait();
    return cloneReceipt.logs?.find( (ev: any) => { return ev.fragment?.name == "ForwarderCreated"})?.args[0];
};

export async function extractForwarderDeposited(transaction: any) {
    const cloneReceipt = await transaction.wait();
    const event = cloneReceipt.logs.find( (ev: any) => { return ev.topics.indexOf("0x69b31548dea9b3b707b4dff357d326e3e9348b24e7a6080a218a6edeeec48f9b") !== -1});
    if (!event) {
        return undefined;
    }
    const eventData = event.data;
    const value = BigInt(`0x${eventData.substring(66, 130)}`);
    return value;
};