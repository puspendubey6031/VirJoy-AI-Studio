import { masterWorkflowEngine } from '../src/server/engine/workflowEngine.js';

async function auditRealWorkflow() {
  console.log('================================================================');
  console.log('      VIRJOY AI REAL END-TO-END PIPELINE WORKFLOW AUDIT         ');
  console.log('   Test Case: 1-Minute Video of "The Tortoise and the Hare"    ');
  console.log('================================================================\n');

  const prompt = 'The Tortoise and the Hare - A classic fable about patience, steady progress, and determination winning the race over arrogant speed';
  const targetDurationSeconds = 60;
  const jobId = `audit_job_${Date.now()}`;

  let stage1Success = false;
  let stage2Success = false;
  let stage3Success = false;
  let stage4Success = false;
  let stage5Success = false;
  let stage6Success = false;
  let stage7Success = false;
  let stage8Success = false;
  let stage9Success = false;

  console.log('[STAGE 1: PROMPT INTELLIGENCE]');
  const checkpoint = await masterWorkflowEngine.runFullPipeline({
    jobId,
    userId: 'usr_audit_runner',
    prompt,
    targetDurationSeconds,
    aspectRatio: '16:9',
    voice: 'female-ananya',
    language: 'English',
    planKey: '₹799'
  }, (progress) => {
    // console.log(` -> Pipeline Stage [${progress.currentStage}]: ${progress.overallProgressPercent}%`);
  });

  // Stage 1 Audit
  if (checkpoint.promptIntelligence && checkpoint.promptIntelligence.detectedLanguage) {
    stage1Success = true;
    console.log('✓ Working - Prompt Intelligence');
    console.log(`  - Detected Language: ${checkpoint.promptIntelligence.detectedLanguage}`);
    console.log(`  - Category: ${checkpoint.promptIntelligence.category}`);
    console.log(`  - Visual Style: ${checkpoint.promptIntelligence.visualStyle}`);
    console.log(`  - Recommended Duration: ${checkpoint.promptIntelligence.recommendedDurationSeconds}s`);
    console.log(`  - Recommended Scene Count: ${checkpoint.promptIntelligence.recommendedSceneCount}`);
  } else {
    console.log('✗ Failed - Prompt Intelligence');
  }

  // Stage 2 Audit
  console.log('\n[STAGE 2: SCRIPT GENERATION]');
  if (checkpoint.scriptText && checkpoint.scriptText.length > 100) {
    stage2Success = true;
    console.log('✓ Working - Script Generation');
    console.log(`  - Generated Script Character Count: ${checkpoint.scriptText.length}`);
    console.log(`  - Script Preview: "${checkpoint.scriptText.substring(0, 150)}..."`);
  } else {
    console.log('✗ Failed - Script Generation');
  }

  // Stage 3 Audit
  console.log('\n[STAGE 3: SCENE BREAKDOWN]');
  if (checkpoint.scenes && checkpoint.scenes.length >= 4) {
    stage3Success = true;
    console.log('✓ Working - Scene Breakdown & Motion');
    console.log(`  - Total Scenes Created: ${checkpoint.scenes.length}`);
    const totalSceneDur = checkpoint.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
    console.log(`  - Total Scene Duration Sum: ${totalSceneDur}s`);
  } else {
    console.log('✗ Failed - Scene Breakdown');
  }

  // Stage 4 Audit
  console.log('\n[STAGE 4: IMAGE PROMPT & GENERATION (AI IMAGES)]');
  const validImages = checkpoint.scenes?.filter(s => s.assignedAssetUrl && s.assignedAssetUrl.length > 10) || [];
  if (validImages.length === checkpoint.scenes?.length) {
    stage4Success = true;
    console.log('✓ Working - Image Prompt & Image Generation');
    console.log(`  - Images Generated for ${validImages.length}/${checkpoint.scenes?.length} Scenes`);
    checkpoint.scenes?.forEach((s, idx) => {
      console.log(`    * Scene ${idx + 1} Image URL/Data: ${s.assignedAssetUrl?.substring(0, 60)}...`);
      console.log(`      Camera Motion: ${s.cameraMotion}, Visual Effect: ${s.visualEffect}`);
    });
  } else {
    console.log(`✗ Failed - Image Generation (${validImages.length}/${checkpoint.scenes?.length} generated)`);
  }

  // Stage 5 Audit
  console.log('\n[STAGE 5: VOICE-OVER SYNTHESIS]');
  if (checkpoint.voiceSpec && checkpoint.voiceSpec.audioBufferUrl) {
    stage5Success = true;
    console.log('✓ Working - Voice Synthesis');
    console.log(`  - Voice Model: ${checkpoint.voiceSpec.voiceName}`);
    console.log(`  - Audio Stream URL: ${checkpoint.voiceSpec.audioBufferUrl}`);
    console.log(`  - Speech Duration: ${checkpoint.voiceSpec.audioDurationSeconds}s`);
  } else {
    console.log('✗ Failed - Voice Synthesis');
  }

  // Stage 6 Audit
  console.log('\n[STAGE 6: SUBTITLE TIMING & SYNC]');
  if (checkpoint.subtitleSpec && checkpoint.subtitleSpec.cues.length > 0) {
    stage6Success = true;
    console.log('✓ Working - Subtitle Generation');
    console.log(`  - Subtitle Cues Count: ${checkpoint.subtitleSpec.cues.length}`);
    console.log(`  - Sample Subtitle Cue: "[${checkpoint.subtitleSpec.cues[0].startTimeSec}s - ${checkpoint.subtitleSpec.cues[0].endTimeSec}s] ${checkpoint.subtitleSpec.cues[0].text}"`);
  } else {
    console.log('✗ Failed - Subtitle Generation');
  }

  // Stage 7 Audit
  console.log('\n[STAGE 7: BACKGROUND MUSIC & SFX TIMELINE]');
  if (checkpoint.timelinePackage && checkpoint.timelinePackage.backgroundMusicUrl) {
    stage7Success = true;
    console.log('✓ Working - Background Music & Sound Effects');
    console.log(`  - Background Music Track URL: ${checkpoint.timelinePackage.backgroundMusicUrl}`);
    console.log(`  - Configured SFX & Transitions: ${checkpoint.scenes?.map(s => s.transitionEffect).join(', ')}`);
  } else {
    console.log('✗ Failed - Background Music');
  }

  // Stage 8 Audit
  console.log('\n[STAGE 8: UNIFIED TIMELINE PACKAGE]');
  if (checkpoint.timelinePackage && checkpoint.timelinePackage.id) {
    stage8Success = true;
    console.log('✓ Working - Unified Timeline Package');
    console.log(`  - Timeline Package ID: ${checkpoint.timelinePackage.id}`);
    console.log(`  - Total Package Duration: ${checkpoint.timelinePackage.totalDurationSeconds}s`);
    console.log(`  - Video Aspect Ratio: ${checkpoint.timelinePackage.aspectRatio}`);
  } else {
    console.log('✗ Failed - Unified Timeline Package');
  }

  // Stage 9 Audit
  console.log('\n[STAGE 9: FINAL MP4 COMPOSITION & RENDER PACKAGE]');
  if (checkpoint.renderPackage && checkpoint.renderPackage.rawFFmpegCommand) {
    stage9Success = true;
    console.log('✓ Working - Final MP4 Render Composition');
    console.log(`  - Renderer Target: ${checkpoint.renderPackage.rendererTarget}`);
    console.log(`  - Resolution: ${checkpoint.renderPackage.resolution}`);
    console.log(`  - FFmpeg Command Output: ${checkpoint.renderPackage.rawFFmpegCommand.substring(0, 120)}...`);
  } else {
    console.log('✗ Failed - Final MP4 Composition');
  }

  console.log('\n================================================================');
  console.log('                      FINAL AUDIT SUMMARY                       ');
  console.log('================================================================');
  console.log(`Prompt Intelligence: ${stage1Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Script Generation:    ${stage2Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Scene Breakdown:      ${stage3Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`AI Image Prompt & Gen:${stage4Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Voice Synthesis:      ${stage5Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Subtitle Timing:      ${stage6Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Background Music & SFX:${stage7Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Timeline Assembly:    ${stage8Success ? '✓ Working' : '✗ Failed'}`);
  console.log(`Final MP4 Composition:${stage9Success ? '✓ Working' : '✗ Failed'}`);

  const allPassed = stage1Success && stage2Success && stage3Success && stage4Success && stage5Success && stage6Success && stage7Success && stage8Success && stage9Success;
  if (allPassed) {
    console.log('\n🎉 ALL PIPELINE STAGES PASSED FOR "THE TORTOISE AND THE HARE" 1-MINUTE VIDEO!');
  } else {
    console.error('\n❌ AUDIT FAILED - Pipeline has failing stages.');
    process.exit(1);
  }
}

auditRealWorkflow().catch(err => {
  console.error('Real Workflow Audit Error:', err);
  process.exit(1);
});
