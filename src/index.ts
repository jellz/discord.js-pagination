import { Message, MessageEmbed, User } from 'discord.js';

const formatFooter = (footer: string, current: number, max: number) =>
	footer
		.replace('{current}', current.toString())
		.replace('{max}', max.toString());

export interface PageOptions {
	emojiList: [string, string];
	timeout: number;
	footer: string;
	owner: User | null;
}

export async function editMessageWithPaginatedEmbeds(
	message: Message,
	pages: MessageEmbed[],
	{ emojiList, footer, owner, timeout }: Partial<PageOptions>
) {
	const options: PageOptions = {
		emojiList: emojiList ?? ['⏪', '⏩'],
		timeout: timeout ?? 120000,
		footer: footer ?? 'Showing page {current} of {max}',
		owner: owner || null,
	};
	let page = 0;

	const currentPage = await message.edit(
		pages[page].setFooter(formatFooter(options.footer, page + 1, pages.length))
	);

	for (const emoji of options.emojiList) await currentPage.react(emoji);
	const reactionCollector = currentPage.createReactionCollector(
		(reaction, user) =>
			options.emojiList.includes(reaction.emoji.name) &&
			!user.bot &&
			(options.owner ? options.owner.id === user.id : true),
		{ time: options.timeout }
	);
	reactionCollector.on('collect', (reaction, user) => {
		reaction.users.remove(user);
		switch (reaction.emoji.name) {
			case options.emojiList[0]:
				page = page > 0 ? ++page : pages.length - 1;
				break;
			case options.emojiList[1]:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
		}
		currentPage.edit(
			pages[page].setFooter(
				formatFooter(options.footer, page + 1, pages.length)
			)
		);
	});

	reactionCollector.on('end', () => currentPage.reactions.removeAll());

	return currentPage;
}
