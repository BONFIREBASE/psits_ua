import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env.local', 'utf-8')
let url = '', key = ''
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const k = match[1].trim()
    const v = match[2].trim().replace(/^["']|["']$/g, '')
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') url = v
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') key = v
  }
})

const supabase = createClient(url, key)

async function syncPaidDues() {
  console.log('🔄 Starting sync of paid dues...')

  // 1. Insert or ensure Hannah Kriezel Garcia is in students table
  const hannahStudent = {
    student_no: '2023-S09001',
    full_name: 'GARCIA, HANNAH KRIEZEL',
    full_name_normalized: 'garcia hannah kriezel',
    year_level: 4,
    section: 'C',
    year_section: 'BSIT 4-C',
    program: 'BSIT',
    is_active: true
  }

  const { error: hannahError } = await supabase
    .from('students')
    .upsert(hannahStudent, { onConflict: 'student_no' })

  if (hannahError) {
    console.error('❌ Error inserting Hannah into students table:', hannahError)
  } else {
    console.log('✅ Ensured Hannah Kriezel Garcia is registered in students table')
  }

  // 2. Exact mappings for the 18 dues records
  const mappings = [
    {
      dueId: '5cecf70b-f61d-4c8f-9899-f0606a1891c2',
      student_name: 'MOQUERIO, LANCE IAN EIMAN',
      student_name_normalized: 'moquerio lance ian eiman',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: '40b4ab75-f2b8-4df6-b633-2e3e040e41da',
      student_name: 'ESCAÑO, CY LEIAN BALSOMO',
      student_name_normalized: 'escaño cy leian balsomo',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: 'c4905819-7315-4a67-80c3-39acbaeb07ce',
      student_name: 'SAMILLANO, JOHN LOUIE DOROMAL',
      student_name_normalized: 'samillano john louie doromal',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: '9b000fac-147a-49f4-976f-7f2e13dd9aa1',
      student_name: 'DAPAR, CARMELO OGATIS',
      student_name_normalized: 'dapar carmelo ogatis',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: '8e889b51-15e3-4020-8bd3-e75e6533a1b4',
      student_name: 'LABANON, ERIKA BLAS',
      student_name_normalized: 'labanon erika blas',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: 'fc70087a-6250-477e-b1f6-7206f1ffbeee',
      student_name: 'NIETES, RAYMUND JIE SISON',
      student_name_normalized: 'nietes raymund jie sison',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: '0984461f-4729-4a69-9973-164668bd3f9d',
      student_name: 'BARION, DAISY MAE FRANCISCO',
      student_name_normalized: 'barion daisy mae francisco',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: '8b26bf69-4aa7-4644-b955-50ef5b06100f',
      student_name: 'MANZAN, JENNY DAYAG',
      student_name_normalized: 'manzan jenny dayag',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: '8be66d6c-f441-44f3-9f3e-269fe5bd9c78',
      student_name: 'VILLOJAN, KURT ANGELO SAQUINE',
      student_name_normalized: 'villojan kurt angelo saquine',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: 'd7e9d552-50cd-4bc6-b1f1-0ef7a210e6a3',
      student_name: 'CABRILLOS, VAN IMERINE CABARLES',
      student_name_normalized: 'cabrillos van imerine cabarles',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: '8ae2c9f7-2dc8-4e2f-a6cf-8d7a79b77230',
      student_name: 'PATRICIO, JIREMY CAPISTRANO',
      student_name_normalized: 'patricio jiremy capistrano',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: 'fd23664b-2803-4244-8357-d4c3948fca55',
      student_name: 'CORTEJO, KEVIN EDYSON VACIO',
      student_name_normalized: 'cortejo kevin edyson vacio',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: 'ea8d0fdb-441b-45e2-9f90-aee1c25099a0',
      student_name: 'HERNANDEZ, SAMANTHA CHARRISE SAMILLANO',
      student_name_normalized: 'hernandez samantha charrise samillano',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: 'c4f38621-c28e-4394-8ace-ab7ce7b498fc',
      student_name: 'SEITON, BRENDAN ERENEA',
      student_name_normalized: 'seiton brendan erenea',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: '8b0a7649-c0b5-40d8-a968-094ecb62a948',
      student_name: 'TORRES, ANGEL MAE SONGCOG',
      student_name_normalized: 'torres angel mae songcog',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: 'db696499-6fa8-45a0-991a-df1c9627514f',
      student_name: 'GARCIA, HANNAH KRIEZEL',
      student_name_normalized: 'garcia hannah kriezel',
      section: 'C',
      year_section: 'BSIT 4-C'
    },
    {
      dueId: '906c035f-af63-4994-bc66-74a682a9382a',
      student_name: 'MANA-AY, JERICA OMAPAS',
      student_name_normalized: 'manaay jerica omapas',
      section: 'D',
      year_section: 'BSIT 4-D'
    },
    {
      dueId: '37358176-5180-42ad-87cd-0cb0c1ef7bcd',
      student_name: 'BACAOCO, DALE HARVEY BESANA',
      student_name_normalized: 'bacaoco dale harvey besana',
      section: 'D',
      year_section: 'BSIT 4-D'
    }
  ]

  let updatedCount = 0
  for (const m of mappings) {
    const { error } = await supabase
      .from('membership_dues')
      .update({
        student_name: m.student_name,
        student_name_normalized: m.student_name_normalized,
        section: m.section,
        year_section: m.year_section,
      })
      .eq('id', m.dueId)

    if (error) {
      console.error(`❌ Error updating ${m.student_name}:`, error.message)
    } else {
      updatedCount++
      console.log(`✅ Updated ${m.student_name} (${m.year_section})`)
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} of ${mappings.length} dues records!`)
}

syncPaidDues()
