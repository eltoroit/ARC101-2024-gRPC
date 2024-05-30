import PubSubApiClient from "salesforce-pubsub-api-client";

async function run() {
	try {
		const client = new PubSubApiClient();
		await client.connect();

		// Subscribe to account change events
		const eventEmitter = await client.subscribe("/data/AccountChangeEvent");

		// Handle incoming events
		eventEmitter.on("data", (event) => {
			console.log(
				`Handling ${event.payload.ChangeEventHeader.entityName} change event ` +
					`with ID ${event.replayId} ` +
					`on channel ${eventEmitter.getTopicName()} ` +
					`(${eventEmitter.getReceivedEventCount()}/${eventEmitter.getRequestedEventCount()} ` +
					`events received so far)`
			);
			console.log(event);
			console.log(JSON.stringify(event, null, 2));
		});
	} catch (error) {
		console.error(error);
	}
}

run();
