set terminal pngcairo enhanced font "Arial,12" size 800,600
set output "～/.openclaw/workspace/讲座规划/reports/charts_20260403/roi_analysis.png"
set title "AIGC培训ROI分析"
set xlabel("指标")
set ylabel("金额 (元)")
set grid
set style data histograms
set boxwidth 0.6
set style fill solid 1.0
plot '< jq -r ".roi_data | to_entries[] | select(.key | contains(\"cost\") or contains(\"benefit\")) | \"\(.key) \(.value)\"" [2026-04-03 15:10:50] 开始收集AIGC培训效果数据...
[2026-04-03 15:10:50] 收集学习数据...
[2026-04-03 15:10:50] 数据收集完成: ～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json
～/.openclaw/workspace/讲座规划/data/temp_data_20260403_151050.json' using 2:xtic(1) title "金额"
