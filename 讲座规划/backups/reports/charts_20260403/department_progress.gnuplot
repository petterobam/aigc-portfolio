set terminal pngcairo enhanced font "Arial,12" size 800,600
set output "～/.openclaw/workspace/讲座规划/reports/charts_20260403/department_progress.png"
set title "AIGC培训部门进度监控"
set xlabel("部门")
set ylabel("进度 (%)")
set grid
set style data histograms
set style histogram columnstacked
set boxwidth 0.8
set style fill solid 1.0
plot '< jq -r ".learning_data.department_progress | to_entries[] | \"\(.key) \(.value)\"" [2026-04-03 15:10:50] 开始收集AIGC培训效果数据...
[2026-04-03 15:10:50] 收集学习数据...
[2026-04-03 15:10:50] 数据收集完成: ～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json
～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json' using 2:xtic(1) title "进度",      '< jq -r ".learning_data.test_scores | to_entries[] | \"\(.key) \(.value)\"" [2026-04-03 15:10:50] 开始收集AIGC培训效果数据...
[2026-04-03 15:10:50] 收集学习数据...
[2026-04-03 15:10:50] 数据收集完成: ～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json
～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json' using 2:xtic(1) title "测试成绩"
