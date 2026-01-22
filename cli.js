#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CLAUDE_SKILLS_DIRS = {
  darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'skills'),
  linux: path.join(os.homedir(), '.config', 'Claude', 'skills'),
  win32: path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'skills')
};

async function init() {
  try {
    console.log('🚀 Initializing Move Skills for Claude Desktop...\n');

    // Get the appropriate skills directory for the current platform
    const platform = os.platform();
    const skillsDir = CLAUDE_SKILLS_DIRS[platform];

    if (!skillsDir) {
      console.error(`❌ Unsupported platform: ${platform}`);
      process.exit(1);
    }

    console.log(`📁 Target directory: ${skillsDir}\n`);

    // Create skills directory if it doesn't exist
    await fs.ensureDir(skillsDir);

    // Get the source directory (where the skills are in this package)
    const sourceDir = path.join(__dirname, 'move_claude_skill', 'plugins');

    // Check if source directory exists
    if (!await fs.pathExists(sourceDir)) {
      console.error(`❌ Source directory not found: ${sourceDir}`);
      process.exit(1);
    }

    // Copy both plugin directories
    const plugins = ['aptos-move-contract', 'aptos-ts-sdk'];
    
    for (const plugin of plugins) {
      // Source is now the skills subdirectory within each plugin
      const sourcePath = path.join(sourceDir, plugin, 'skills', plugin);
      const targetPath = path.join(skillsDir, plugin);

      if (!await fs.pathExists(sourcePath)) {
        console.warn(`⚠️  Plugin not found: ${plugin}, skipping...`);
        continue;
      }

      // Check if target already exists
      if (await fs.pathExists(targetPath)) {
        console.log(`📦 Updating ${plugin}...`);
        await fs.remove(targetPath);
      } else {
        console.log(`📦 Installing ${plugin}...`);
      }

      // Copy the plugin contents (SKILL.md should be at root level)
      await fs.copy(sourcePath, targetPath);
      console.log(`   ✅ ${plugin} installed successfully`);
    }

    console.log('\n✨ Move Skills installed successfully!\n');
    console.log('Next steps:');
    console.log('1. Restart Claude Desktop');
    console.log('2. The skills will be available in Claude\'s skill selector');
    console.log('\nAvailable skills:');
    console.log('  • aptos-move-contract - Move smart contract development');
    console.log('  • aptos-ts-sdk - Aptos TypeScript SDK integration\n');

  } catch (error) {
    console.error('❌ Error installing Move Skills:', error.message);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await init();
      break;
    case '--help':
    case '-h':
      console.log('Move Skills CLI\n');
      console.log('Usage:');
      console.log('  npx move-skills init    Install Move skills for Claude Desktop');
      console.log('  npx move-skills --help  Show this help message\n');
      break;
    default:
      if (!command) {
        console.log('Move Skills CLI\n');
        console.log('Usage: npx move-skills init\n');
        console.log('Run "npx move-skills --help" for more information');
      } else {
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "npx move-skills --help" for usage information');
        process.exit(1);
      }
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

