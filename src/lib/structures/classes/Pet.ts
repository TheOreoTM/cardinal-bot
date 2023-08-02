// import { PetData, ShinyChance } from '#utils/petConstants';
// import { getRandomNumberInRange, sumArray } from '#utils/utils';
// import type { PetStatType, Prisma } from '@prisma/client';
// import { container } from '@sapphire/framework';
// import random from 'random';

// interface PetCreateInput extends Prisma.PetCreateInput {}

// const ivList = [generateIv(), generateIv(), generateIv(), generateIv()];

// export class Pet implements PetCreateInput {
// 	id?: number | bigint | undefined;
// 	nickname?: string | undefined;
// 	favourite?: boolean | undefined;
// 	user?: Prisma.UserCreateNestedOneWithoutPetsInput | undefined;
// 	items?: Prisma.PetItemCreateNestedManyWithoutPetInput | undefined;
// 	moves?: Prisma.PetMoveCreateNestedManyWithoutPetInput | undefined;

// 	public petId: number;
// 	public name: string;
// 	public level = Math.floor(random.normal(20, 10)());
// 	public xp = 0;
// 	public xpTotal = calculateTotalXpEarned(this.level, this.xp);
// 	public xpRequired = calculateXpRequired(this.level + 1);

// 	public hpIV: number = ivList[0];
// 	public atkIV: number = ivList[1];
// 	public defIV: number = ivList[2];
// 	public spdIV: number = ivList[3];
// 	public totalIV: number = sumArray(ivList);
// 	public averageIV: number = averageIv(ivList);

// 	public hpStat: number;
// 	public atkStat: number;
// 	public defStat: number;
// 	public spdStat: number;

// 	public shiny: boolean = Math.random() <= ShinyChance;
// 	public idx: number = -1;

// 	public constructor(data: PetCreateData) {
// 		this.name = data.name;
// 		this.petId = data.petId;
// 		this.shiny = data.shiny !== undefined ? data.shiny : this.shiny;

// 		this.hpStat = calculateBaseStat(this, 'Health');
// 		this.atkStat = calculateBaseStat(this, 'Attack');
// 		this.defStat = calculateBaseStat(this, 'Defense');
// 		this.spdStat = calculateBaseStat(this, 'Speed');

// 		this.xp;
// 		this.xp = data.xp ? data.xp : this.xp;
// 		this.level = data.level ? data.level : this.level;
// 	}

// 	public async generate(userId: string) {
// 		this.idx = await fetchNextIdx(userId);
// 		await container.db.user.update({ where: { userId: userId }, data: { pets: { create: this } } });
// 		return this;
// 	}
// }

// function generateIv() {
// 	return getRandomNumberInRange(0, 31);
// }

// function averageIv(numbers: number[]): number {
// 	if (numbers.length === 0) {
// 		throw new Error('The array must not be empty.');
// 	}

// 	const sum = sumArray(numbers);
// 	const average = sum / numbers.length;

// 	return average;
// }

// function calculateBaseStat(pet: Pet, stat: PetStatType) {
// 	let find = PetData.get(`${pet.petId}`);
// 	if (!find) return -1;

// 	let base: number;
// 	let iv: number;
// 	switch (stat) {
// 		case 'Attack':
// 			iv = pet.atkIV;
// 			base = find.baseStats.atk;
// 			break;
// 		case 'Defense':
// 			iv = pet.defIV;
// 			base = find.baseStats.def;
// 			break;
// 		case 'Speed':
// 			iv = pet.spdIV;
// 			base = find.baseStats.spd;
// 			break;
// 		case 'Health':
// 			iv = pet.hpIV;
// 			base = find.baseStats.hp;
// 			break;

// 		default:
// 			iv = 0;
// 			base = 0;
// 			break;
// 	}
// 	return Math.round(((2 * base + iv + 5) * (pet.level ?? 1)) / 100 + 5);
// }

// function calculateTotalXpEarned(level: number, currentXp: number) {
// 	if (level <= 0) {
// 		throw new Error('Invalid target level. Level should be greater than 0.');
// 	}

// 	let totalXpRequired = 0;

// 	for (let l = 1; l <= level; l++) {
// 		totalXpRequired += (level + 1) * 25 + 250;
// 	}

// 	return totalXpRequired + currentXp;
// }

// function calculateXpRequired(targetLevel: number) {
// 	return (targetLevel + 1) * 25 + 250;
// }

// async function fetchNextIdx(userId: string) {
// 	const user = await container.db.user.update({ where: { userId }, data: { petNextIdx: { increment: 1 } }, select: { petNextIdx: true } });
// 	return user.petNextIdx;
// }

// interface PetCreateData {
// 	name: string;
// 	petId: number;
// 	shiny?: boolean;
// 	xp?: number;
// 	level?: number;
// }
