const fs = require('fs');
const c  = require('ansi-colors');

// tool specific modules
const create_readme = require('../core/create_readme');
const setup = require('../core/setup');

// don't enter setup, just check to see if we have a username
const { username, initialize_at_one } = setup(true); 

if ( username ) {
	console.log(`Hello ${username}, writing the leaderboard for you...`);
	write_leaderboard(username);
} else {
	console.log(`You haven't contributed to any solutions yet and don't`);
	console.log(`have a username on file. Please run:\n`);
	console.log(`    ${c.yellow.bold('npm run setup')}`);
	process.exit(0);
}

function write_leaderboard(username) {
	const submissions = {
		problems  : {},
		solutions : {},
		languages : {},
		users     : {},
	};
	const euler_path = __dirname.replace('/scripts','/');
	submissions.problems = fs
		.readdirSync(`${euler_path}/eulers/`, {
			withFileTypes: true,
		})
		.filter(dirent => dirent.isDirectory())
		.map(dir => { 
			const problem = parseInt(dir.name.split('-')[0].replace('e',''));
			return {
				problem: problem,
				folder: dir.name,
				dir: `${dir.path}${dir.name}`,
			}
		});
	for ( let i = 0; i < submissions.problems.length; ++i ) {
		const prob  = submissions.problems[i];
		const langs = fs.readdirSync(`${prob.dir}`, { withFileTypes: true })
			.filter(dir => dir.isDirectory())
			.map(dir => {
				if ( dir.name in submissions.languages ) {
					submissions.languages[dir.name].count++;
				} else {
					submissions.languages[dir.name] = { count: 1, max: null, max_user: null};
				}
				return { language: dir.name, dir: `${dir.path}/${dir.name}` };
			});

		for ( let l = 0; l < langs.length; ++l ) {
			const solves = fs.readdirSync(langs[l].dir, { withFileTypes: true })
				.filter(dir => dir.isDirectory())
				.map(dir => {
					if ( dir.name in submissions.users ) {
						submissions.users[dir.name].count++;
						if ( langs[l].language in submissions.users[dir.name].languages ) {
							submissions.users[dir.name].languages[langs[l].language]++;
						} else {
							submissions.users[dir.name].languages[langs[l].language] = 1;
						}
					} else {
						submissions.users[dir.name] = {
							count: 1,
							languages: {},
						};
						submissions.users[dir.name].languages[langs[l].language] = 1;
					}
				});
		}
		for ( const username in submissions.users ) {
			const user = submissions.users[username];
			for ( const lang in user.languages ) {
				if ( user.languages[lang] > submissions.languages[lang].max ) {
					submissions.languages[lang].max      = user.languages[lang];
					submissions.languages[lang].max_user = username;
				}
			}
		}
	}

	const leaderboard_content = create_readme('usage_leaderboard', {
		submissions: submissions,
	});

	fs.writeFileSync(`${euler_path}/eulers/LEADERBOARD.md`, leaderboard_content);
	console.log(`     Updating LEADERBOARD: ${c.green.bold('./eulers/LEADERBOARD.md')}`);
}
