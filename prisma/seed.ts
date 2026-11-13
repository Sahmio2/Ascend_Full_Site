import 'dotenv/config';
import { db } from '../src/server/db';
import catalogue from './catalogue.json';
// Intentionally disables evaluation on reseed; do not use this seed as a live rules migration.
const prisma=db();
try{await prisma.$transaction(async tx=>{
  for(const group of catalogue.groups)await tx.achievementGroup.upsert({where:{id:group.id},create:group,update:group});
  for(const definition of catalogue.definitions)await tx.achievementDefinition.upsert({where:{id:definition.id},create:definition,update:definition});
});console.log('Seeded 8 groups and 96 definitions; award evaluation disabled.')}finally{await prisma.$disconnect()}
