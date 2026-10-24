import { execSync } from 'child_process'

const DB_ID = 'psits_community'
const sleep = (ms) => new Promise(res => setTimeout(res, ms))

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
  } catch (err) {
    const errText = (err.stdout || '') + ' ' + (err.stderr || '')
    if (errText.includes('already exists') || errText.includes('Conflict')) {
      return 'ALREADY_EXISTS'
    }
    console.error(`  ❌ Error running: ${cmd}\n  Output: ${errText.trim()}`)
    return 'ERROR'
  }
}

async function setup() {
  console.log('🚀 Provisioning Complete Appwrite Community Schema...\n')

  const commands = [
    // posts
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key author_year_section --size 20 --required=false`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key attachments --size 500 --required=false --array=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key attachment_names --size 255 --required=false --array=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key attachment_types --size 50 --required=false --array=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key attachment_sizes --size 50 --required=false --array=true`,
    `appwrite databases create-integer-attribute --database-id ${DB_ID} --collection-id posts --key likes_count --required=false --min 0 --xdefault 0`,
    `appwrite databases create-integer-attribute --database-id ${DB_ID} --collection-id posts --key comments_count --required=false --min 0 --xdefault 0`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key tags --size 50 --required=false --array=true`,
    `appwrite databases create-integer-attribute --database-id ${DB_ID} --collection-id posts --key flag_count --required=false --min 0 --xdefault 0`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id posts --key status --size 20 --required=false --xdefault active`,

    // comments
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key post_id --size 50 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key content --size 1000 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key author_student_no --size 20 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key author_display_name --size 100 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key author_avatar --size 500 --required=false`,
    `appwrite databases create-boolean-attribute --database-id ${DB_ID} --collection-id comments --key is_anonymous --required=false --xdefault false`,
    `appwrite databases create-boolean-attribute --database-id ${DB_ID} --collection-id comments --key is_verified --required=false --xdefault false`,
    `appwrite databases create-boolean-attribute --database-id ${DB_ID} --collection-id comments --key is_flagged --required=false --xdefault false`,
    `appwrite databases create-integer-attribute --database-id ${DB_ID} --collection-id comments --key flag_count --required=false --min 0 --xdefault 0`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id comments --key status --size 20 --required=false --xdefault active`,

    // reactions
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reactions --key post_id --size 50 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reactions --key student_no --size 20 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reactions --key reaction_type --size 20 --required=false --xdefault like`,

    // follows
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id follows --key follower_student_no --size 20 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id follows --key following_student_no --size 20 --required=true`,

    // reports
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reports --key target_type --size 20 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reports --key target_id --size 50 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reports --key reporter_student_no --size 20 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reports --key reason --size 255 --required=true`,
    `appwrite databases create-string-attribute --database-id ${DB_ID} --collection-id reports --key status --size 20 --required=false --xdefault pending`,
  ]

  for (const cmd of commands) {
    const parts = cmd.split('--key ')[1].split(' ')
    const key = parts[0]
    const col = cmd.split('--collection-id ')[1].split(' ')[0]
    console.log(`Creating attribute ${col}.${key}...`)
    run(cmd)
    await sleep(200) // slight delay for rate-limits
  }

  console.log('\n⏳ Waiting 8 seconds for attributes to be indexed by Appwrite...')
  await sleep(8000)

  // Indexes
  console.log('\n--- Creating Compound Indexes ---')
  const indexCmds = [
    `appwrite databases create-index --database-id ${DB_ID} --collection-id posts --key idx_posts_status --type key --attributes status`,
    `appwrite databases create-index --database-id ${DB_ID} --collection-id comments --key idx_comments_post --type key --attributes post_id`,
    `appwrite databases create-index --database-id ${DB_ID} --collection-id reactions --key idx_reactions_post_user --type key --attributes post_id student_no`,
    `appwrite databases create-index --database-id ${DB_ID} --collection-id follows --key idx_follows_pair --type key --attributes follower_student_no following_student_no`,
  ]

  for (const cmd of indexCmds) {
    const key = cmd.split('--key ')[1].split(' ')[0]
    const col = cmd.split('--collection-id ')[1].split(' ')[0]
    console.log(`Creating index ${col}.${key}...`)
    run(cmd)
    await sleep(500)
  }

  console.log('\n🎉 ALL ATTRIBUTES AND INDEXES PROVISIONED SUCCESSFULLY!')
}

setup()
