import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Verifying database tables...');
    
    const tableTests = [];
    
    // Test each table individually
    const tablesToTest = [
      'documents',
      'document_analysis', 
      'extracted_data',
      'agent_tasks',
      'generated_content'
    ];
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.error(`❌ Table ${tableName} failed:`, error.message);
          tableTests.push({
            table: tableName,
            exists: false,
            error: error.message
          });
        } else {
          console.log(`✅ Table ${tableName} accessible`);
          tableTests.push({
            table: tableName,
            exists: true,
            rowCount: data?.length || 0
          });
        }
      } catch (err) {
        console.error(`❌ Table ${tableName} exception:`, err);
        tableTests.push({
          table: tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    const successfulTables = tableTests.filter(t => t.exists);
    const failedTables = tableTests.filter(t => !t.exists);
    
    console.log(`📊 Results: ${successfulTables.length}/${tablesToTest.length} tables accessible`);
    
    return NextResponse.json({
      success: successfulTables.length === tablesToTest.length,
      message: `${successfulTables.length}/${tablesToTest.length} tables accessible`,
      tables: tableTests,
      summary: {
        successful: successfulTables.length,
        failed: failedTables.length,
        total: tablesToTest.length
      }
    });
    
  } catch (error) {
    console.error('❌ Table verification failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Table verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
